import {_} from "./fp.js";

_.importScripts = (...sources) => {
	const script = Array.from(document.querySelectorAll("script")).pop();
	const prefix = script.src.slice(0, script.src.lastIndexOf("/") + 1);
	for (const src of sources) document.write(`<script src="${prefix}${src}"></script>`);
};

/// LCS
_.LCS = (s1, s2) => {
	s1 = s1 || [];
	s2 = s2 || [];

	let M = [];
	for (let i = 0; i <= s1.length; i++) {
		M.push([]);

		for (let j = 0; j <= s2.length; j++) {
			let currValue = 0;
			if (i === 0 || j === 0) {
				currValue = 0;
			}
			else if (s1[i - 1] === s2[j - 1]) {
				currValue = M[i - 1][j - 1] + 1;
			}
			else {
				currValue = Math.max(M[i][j - 1], M[i - 1][j]);
			}

			M[i].push(currValue);
		}
	}

	let i = s1.length;
	let j = s2.length;

	// let s3 = [];
	let s4 = Array(i).fill(null);
	let s5 = Array(j).fill(null);

	while (M[i][j] > 0) {
		if (s1[i - 1] === s2[j - 1] && (M[i - 1][j - 1] + 1 === M[i][j])) {
			// s3.unshift(s1[i - 1]);

			s4[i - 1] = s1[i - 1];
			s5[j - 1] = s1[i - 1];

			i--;
			j--;
		}
		else if (M[i - 1][j] > M[i][j - 1]) {
			i--;
		}
		else {
			j--;
		}
	}

	return [s4, s5];
};