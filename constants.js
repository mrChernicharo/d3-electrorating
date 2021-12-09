const HIERARCHY_ARRS = {
	root: [],
	parents: [],
	companies: [],
};
const COLORS = [
	'cornflowerblue', // 0: "ARGENTINA"
	'olive', // 1: "BELIZE"
	'goldenrod', // 2: "COSTA RICA"
	'mediumseagreen', // 3: "ECUADOR"
	'lightgreen', // 4: "EL SALVADOR"
	'forestgreen', // 5: "GUYANA"
	'indigo', // 6: "JAMAICA"
	'salmon', // 7: "MEXICO"
	'blue', // 8: "PANAMA"
	'tan', // 9: "BOLIVIA"
	'green', // 10: "BRASIL"
	'coral', // 11: "PARAGUAY"
	'peru', // 12: "PERU"
	'lightcoral', // 13: "REPUBLICA DOMINICANA"
	'crimson', // 14: "CHILE"
	'darkorange', // 15: "COLOMBIA"
	'royalblue', // 16: "URUGUAY"
];

let margins = { top: 100, left: document.body.innerWidth / 20 };
let width = document.body.innerWidth - margins.left * 2;
let height = document.body.innerHeight - margins.top * 2;
