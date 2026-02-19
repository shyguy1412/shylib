import style from './COMPONENT.module.css';
import { h } from 'preact';
import { memo } from 'preact/compat';

export namespace COMPONENT {
    export type Props = {};
}

const COMPONENTComponent = ({}: COMPONENT.Props) => {
    return <div></div>;
};

export const COMPONENT = memo(COMPONENTComponent);
