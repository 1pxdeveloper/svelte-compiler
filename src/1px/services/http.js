import {_} from "1px/fp";
import {Observable} from "1px/observable";

let timerId = 0;

class HttpService {
	constructor(init = {}, http) {
		this.init = http ? {...http.init, ...init} : {...init};
	}

	/// Request
	request(data) { return new HttpService(data, this) }

	url(url) { return this.request({url}) }

	headers(headers) { return this.request({headers}) }

	mode(mode) { return this.request({mode}) }

	body(body) { return this.request({body}) }

	preScript(preScript) {return this.request({preScript}) }


	/// Request - methods
	method(method, ...url) { return this.request({method, url: url.join("/")}) }

	GET(...url) { return this.method("GET", ...url) }

	POST(...url) { return this.method("POST", ...url) }

	PUT(...url) { return this.method("PUT", ...url) }

	DELETE(...url) { return this.method("DELETE", ...url) }

	PATCH(...url) { return this.method("PATCH", ...url) }

	HEAD(...url) { return this.method("HEAD", ...url) }

	OPTIONS(...url) { return this.method("OPTIONS", ...url) }


	/// Response
	response(response) { return this.request({response}) }


	/// Request -> Response
	send(body) {
		const _body = body;

		const url = this.init.url;
		let init = this.init;

		if (body) {
			body = init.body ? init.body(body) : body;
			init = {...this.init, body};
		}

		/// @FIXME:
		if (init.method === "GET" || init.method === "DELETE" || init.method === "HEAD") {
			init = {...this.init};
			delete init.body;
		}

		// if (typeof init.preScript === "function") {
		// 	init = {...init, ...init.preScript(init)};
		// }

		const response = init.response || ((res) => res.text());
		const mock = init.mock;
		const method = init.method;

		return new Observable(observer => {
			console.group(init.method, url);
			console.log("Request", _body);
			console.time("Time" + (++timerId));
			console.groupEnd();


			/// @FIXME: MOCK UP / SUCCESS / FAILURE 분기 처리
			let ok = true;
			const request = mock ? Observable.of(mock[method + " " + url]).delay(250) : fetch(url, init).then(res => {
				ok = res.ok;
				return res;
			}).then(response).then(res => {
				if (!ok) throw res;
				return res;
			})

			return Observable.castAsync(request)
				.tap(res => console.group("Response", init.method, url))
				.tap(_.log("Response"))
				.tap(() => console.timeEnd("Time" + (timerId--)))
				.finalize(() => {
					console.groupEnd();
				})
				.subscribe(observer);
		});
	}

	useMock(mock) { return this.request({mock}) }
}

export const urlencoded = (object) => Object.keys(object).map(key => `${key}=${encodeURIComponent(object[key])}`).join("&");

export const http$ = new HttpService();