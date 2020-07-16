import {createAction, createWritable, dispatch, on} from "../dataLayer";
import {Observable} from "../observable";


/// Atoms
const REGEX_ID = /:([^\s/]+)/g

const replaceURL = (url, ...params) => {
  let index = 0;
  const path = url;
  url = url.replace(REGEX_ID, () => params[index++]);
  return {url, path, params};
}

const navigateTo = (params) => {
  const {url, replace} = params;
  const pathname = location.hash.slice(1);
  const method = (pathname === url || replace) ? "replaceState" : "pushState";
  history[method](params, url, url)
}

export const _GO = createAction("_GO", (url, ...params) => replaceURL(url, ...params))
export const _GO_REPLACE = createAction("_GO", (url, params) => ({..._GO(url, params), replace: true}))
export const _BACK = createAction("_BACK")
export const _ROUTE = createAction("_ROUTE")

export const location$ = createWritable(undefined);
Observable.fromEvent(window, "popstate", true)
  .writeTo(location$, location)

Observable.of(location)
  .delay(0)
  .writeTo(location$)

on(_GO)
  .tap(navigateTo)
  .writeTo(location$, location)

on(_BACK)
  .tap(state => history.go(-1))
  .createEffect()

location$
  .dispatch(location => _ROUTE(location))


/// Router Registry
const registry = [];

const _createMatcher = (path = "") => {
  const keys = [];
  const matcher = path.replace(REGEX_ID, (a, key) => {
    keys.push(key)
    return REGEX_ID.source.slice(1);
  });

  return {
    keys,
    matcher: new RegExp("^" + matcher + "$")
  }
}

const createMatcher = (path) => _createMatcher(path);

const createRouteMatcher = (pathPattern) => {
  const {keys, matcher} = createMatcher(pathPattern);
  return {
    test: (pathname) => matcher.test(pathname),
    parse: (pathname) => {
      let index = 0;
      const result = {};
      pathname.replace(new RegExp(matcher.source, "g"), (a, value) => result[keys[index++]] = value);
      return result;
    }
  }
}


export const currentRoute$ = createWritable(undefined, "currentRoute$");

on(_ROUTE)
  .map(location => {
    const pathname = location.pathname; // location.hash.slice(1);
    const route = registry.find(({matcher}) => matcher.test(pathname))
    return route && {...route, params: route.matcher.parse(pathname)}
  })
  .writeTo(currentRoute$);


export const onRoute = (path) => {
  if (!registry[path]) {
    const routeTemplate = {path, matcher: createRouteMatcher(path)};
    registry.push(routeTemplate);
    registry[path] = routeTemplate;
  }

  return new Observable(observer => {
    return currentRoute$
      .filter(route => route)
      .filter(route => route.path === path)
      .map(route => route.params)
      .delay(0)
      .subscribe(observer)
  })
}


export const router = onRoute;

router.go = (url) => dispatch(_GO(url))
router.back = () => dispatch(_BACK())
router.replace = (url) => dispatch(_GO(url))