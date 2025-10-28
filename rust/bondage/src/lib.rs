use core::f64;
use std::{cell::OnceCell, sync::Mutex};

pub use bondage_macros::*;
pub use neon::prelude::*;

#[linkme::distributed_slice]
pub static JS_EXPORTS: [(&str, fn(FunctionContext) -> JsResult<JsValue>)];

/**
 * M stores the inner value of a monad if the monad is transferrable
 */
pub trait Transferable {
    type JsForm: Value;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, Self::JsForm>>;
    fn from_js<'cx>(ctx: &mut Cx<'cx>, object: Handle<'cx, Self::JsForm>) -> NeonResult<Self>
    where
        Self: Sized;
}

impl Transferable for String {
    type JsForm = JsString;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsString>> {
        Ok(ctx.string(self))
    }

    fn from_js<'cx>(ctx: &mut Cx<'cx>, object: Handle<'cx, JsString>) -> NeonResult<Self> {
        Ok(object.value(ctx))
    }
}

impl Transferable for f64 {
    type JsForm = JsNumber;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsNumber>> {
        Ok(ctx.number(*self))
    }

    fn from_js<'cx>(ctx: &mut Cx<'cx>, object: Handle<'cx, JsNumber>) -> NeonResult<Self> {
        Ok(object.value(ctx))
    }
}

impl Transferable for bool {
    type JsForm = JsBoolean;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsBoolean>> {
        Ok(ctx.boolean(*self))
    }

    fn from_js<'cx>(ctx: &mut Cx<'cx>, object: Handle<'cx, JsBoolean>) -> NeonResult<Self> {
        Ok(object.value(ctx))
    }
}

impl<T> Transferable for Vec<T>
where
    T: Transferable,
{
    type JsForm = JsArray;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsArray>> {
        let arr = JsArray::new(ctx, self.len());

        self.iter().enumerate().for_each(|(i, el)| {
            let el = el
                .to_js(ctx)
                .map(|v| v.as_value(ctx))
                .unwrap_or(ctx.undefined().as_value(ctx));
            let _ = arr.set(ctx, i.to_string().as_str(), el);
        });

        Ok(arr)
    }

    fn from_js<'cx>(ctx: &mut Cx<'cx>, array: Handle<'cx, JsArray>) -> NeonResult<Self> {
        let vec = array.to_vec(ctx)?;

        let vec: Vec<_> = vec
            .iter()
            .filter_map(|el| {
                el.downcast::<T::JsForm, Cx>(ctx)
                    .ok()
                    .and_then(|el| T::from_js(ctx, el).ok())
            })
            .collect();

        Ok(vec)
    }
}

impl<T> Transferable for Option<T>
where
    T: Transferable,
{
    type JsForm = JsValue;
    fn to_js<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsValue>> {
        match self {
            Some(value) => Ok(value.to_js(ctx)?.as_value(ctx)),
            None => Ok(ctx.undefined().upcast::<JsValue>()),
        }
    }

    fn from_js<'cx>(ctx: &mut Cx<'cx>, value: Handle<'cx, JsValue>) -> NeonResult<Self> {
        let value = match value.is_a::<T::JsForm, _>(ctx) {
            true => value.downcast::<T::JsForm, _>(ctx).unwrap(),
            false => return Ok(None),
        };

        Transferable::from_js(ctx, value).map(|v| Some(v))
    }
}

pub trait Event: Transferable {
    fn name(&self) -> &str;
    fn data<'cx>(&self, ctx: &mut Cx<'cx>) -> NeonResult<Handle<'cx, JsValue>>;
}

#[derive(Debug)]
pub struct EventSystem {
    channel: Channel,
    listener: Option<Root<JsFunction>>,
}

pub trait EventSystemTrait {
    fn set_event_listener(&self, callback: Root<JsFunction>);
    fn dispatch_event<T: Event + Send + 'static>(&'static self, event: T);
}

impl EventSystemTrait for Mutex<OnceCell<EventSystem>> {
    fn set_event_listener(&self, callback: Root<JsFunction>) {
        let mut lock = self.lock().unwrap();
        let event_system = lock.get_mut().unwrap();
        event_system.listener = Some(callback);
    }

    fn dispatch_event<T: Event + Send + 'static>(&'static self, event: T) {
        let mut lock = self.lock().unwrap();
        let event_system = lock.get_mut().unwrap();
        event_system.channel.send(move |mut ctx| {
            let mut lock = self.lock().unwrap();
            let event_system = lock.get_mut().unwrap();
            let name = event.name();

            let data = event.data(&mut ctx)?;

            let callback = match &event_system.listener {
                Some(cb) => cb.to_inner(&mut ctx),
                None => return Ok(()),
            };

            let mut bind = callback.bind(&mut ctx);

            bind.arg(name)?;
            bind.arg(data)?;

            bind.exec()?;
            Ok(())
        });
    }
}

impl EventSystem {
    pub fn new(channel: Channel) -> Self {
        EventSystem {
            channel,
            listener: None,
        }
    }
}
pub static EVENT_SYSTEM: Mutex<OnceCell<EventSystem>> = Mutex::new(OnceCell::new());

pub fn println<T: Transferable>(ctx: &mut Cx<'_>, msg: &T) {
    let msg = if let Some(msg) = msg.to_js(ctx).ok() {
        msg
    } else {
        return;
    };

    let log_option = ctx
        .global::<JsObject>("console")
        .and_then(|console| console.method(ctx, "log"))
        .ok();

    let mut log = if let Some(log_inner) = log_option {
        log_inner
    } else {
        return;
    };

    let _ = log.arg(msg);

    let _ = log.call::<()>();
}
