import style from './COMPONENT.module.css';
import { h } from 'preact';
import { memo } from 'preact/compat';

namespace COMPONENT {
    export type Props = {};
}

export const COMPONENT = memo(({}: COMPONENT.Props) => {
    return <div></div>;
});
