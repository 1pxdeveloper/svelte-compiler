import {dispatch} from "../dataLayer";

const noop = () => {};
export const showToast = (message, buttons=[], callback = noop) => dispatch("UIToast/SHOW", {message, buttons, callback})