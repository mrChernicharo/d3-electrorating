console.log('Hello Electrorating');

window.addEventListener('resize', update);

let formatedData,
	dataByYear,
	chartData,
	hierachy,
	hierarchyArrs = HIERARCHY_ARRS,
	colors = COLORS,
	colorsInterpol,
	selectedProp = 'year',
	selectedYear = 2014,
	theme = 'All',
	indicator = 'ACTIVOS CORRIENTES',
	allCountries,
	currentCountries,
	inactiveCountries = [],
	allIndicators,
	interval,
	time = 2000,
	svg,
	hideThreshold = 0.001,
	stratify,
	treemap;

let margins = { top: 100, left: document.body.innerWidth / 20 };
let width = document.body.innerWidth - margins.left * 2;
let height = document.body.innerHeight - margins.top * 2;

$('#date-slider').slider({
	range: false,
	max: 2020,
	min: 2000,
	step: 1,
	slide: (e, ui) => {},
	value: selectedYear,
});

$('button#play').on('click', e => {
	$('button#pause').show();
	$('button#play').hide();
});
$('button#pause').on('click', e => {
	$('button#pause').hide();
	$('button#play').show();
});
$('button#reset').on('click', e => {});
$('select#indicator').on('change', e => {});

function countryClick(e) {}

(async function init() {
	// prettier-ignore
	const rawData = await d3.dsv(';', '../data/electrorating_indicadores_no_financieros.csv');
	console.log(rawData);

	svg = d3.select('svg');

	g = svg.append('g');

	stratify = d3
		.stratify()
		.id(d => d.id)
		.parentId(d => d.parent);

	treemap = (width, height) =>
		d3.treemap().size([width, height]).paddingOuter(1).paddingInner(1);
})();

function update() {
	setDims();

	let root = stratify(hierachy)
		.sum(d => {
			let isLeaf =
				d.parent &&
				d.parent !== 'Root' &&
				!inactiveCountries.includes(d.parent);
			return isLeaf ? d.value : 0;
		})
		.sort((a, b) => b.value - a.value);

	treemap(width, height)(root);

	// ----------------- TEXT ----------------- ///

	d3.select('#chart-area')
		.selectAll('.text-div')
		.data([...root.leaves()])
		.join('div');

	// ----------------- RECTS --------------------------- //

	d3.select('g')
		.selectAll('.node')
		.data([...root.leaves()])
		.join('rect')
		.attr('class', d => {
			return d.depth === 1 ? 'node parent' : 'node';
		});

	// ------------------ LEGENDS ------------------ //

	d3.select('#countries-legends')
		.selectAll('div')
		.data(allCountries)
		.enter()
		.append('div')
		.attr('class', 'legend-container')
		.attr('title', d => d)
		.text(d => d)
		.append('div')
		.attr('class', 'legend-btn');

	d3.select('#countries-legends')
		.selectAll('div.legend-btn')
		.data(allCountries)
		.attr('title', d => d);

	// -------------------- EVENTS ----------------------

	$('h1#year-display').text(selectedYear);
	$('#date-slider').slider('value', selectedYear);
	// prettier-ignore
	$('#companies-info').text(`${indicator === 'Todos' ? 'Ocurrencias: ' : 'Companias: '} ${
		hierarchyArrs.companies.filter(item => !inactiveCountries.includes(item.parent)).length}`);
	// prettier-ignore
	$('#countries-info').text(`Países: ${hierarchyArrs.parents
		.filter(item => !inactiveCountries.includes(item.id)).length}`);

	$('#total-info').text(`Valor Acumulado: ${format(allSum)}`);

	$('#countries-legends')
		.children()
		.each(function (i) {})
		.children()
		.each(function (i) {
			if (i === 0) console.log($(this), this.classList);
			$(this).css({ background: colors[i] });
		});
}

function play() {
	function step() {
		if (selectedYear === 2020) {
			selectedYear = 2000;
		} else {
			selectedYear += 1;
		}

		$('#date-slider').value = selectedYear;
		resetLegends();
		wrangleData(rawData);
		update();
	}
	step();
	interval = setInterval(step, time);
}

function pause() {
	clearInterval(interval);
}

function reset() {
	selectedYear = 2000;
}

function resetLegends() {}

function reduceBy(key, data) {
	return data.reduce((acc, player) => {
		acc[player[key]]
			? (acc[player[key]] += player.value)
			: (acc[player[key]] = player.value);
		return acc;
	}, {});
}

function format(x) {
	const s = d3.format('.2s')(x);
	switch (s[s.length - 1]) {
		case 'G':
			return s.slice(0, -1) + 'B'; // billions
		case 'k':
			return s.slice(0, -1) + 'K'; // thousands
	}
	return s;
}

function setDims() {
	margins = { top: 100, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	// console.log({ height, width, left: margins.left, top: margins.top });
}

function wrangleData(data) {
	// formatedData = data.map(item => ({
	// 	value: Number(item['FACT_INDICATOR_Value_USD']),
	// 	localValue: Number(item['FACT_INDICATOR_Value_Local']),
	// 	year: Number(item['TIME_Year']),
	// 	country: item['UTILITY_Country'],
	// 	company: item['UTILITY_Name'],
	// 	indicator: item['INDICATOR_Name'],
	// 	theme: item['INDICATOR_Theme'],
	// }));
	// dataByYearObj = d3
	// 	.nest()
	// 	.key(d => d.year)
	// 	.object(formatedData);
	// // prettier-ignore
	// chartData = dataByYearObj[selectedYear]
	// 	// .filter(item => (theme !== 'All' ? item.theme === theme : true))
	// 	.filter(item => indicator !== 'Todos' ? item.indicator === indicator : true)
	// 	.filter(item => item.value !== 0)
	// 	.filter(item => currentCountries.includes(item.country))
	// // .filter(item => !inactiveCountries.includes(item.country))
	// // inactiveCountries = []
	// allSum = chartData
	// 	.filter(item => !inactiveCountries.includes(item.country))
	// 	.reduce((acc, item) => (acc += Math.abs(item.value)), 0);
	// hierarchyArrs = {
	// 	root: [{ id: 'Root', parent: '', value: allSum }],
	// 	parents: Object.entries(reduceBy('country', chartData)).map(
	// 		([k, v]) => ({ id: k, value: v, parent: 'Root' })
	// 	),
	// 	companies: chartData.map(item => ({
	// 		id: item.company,
	// 		value: item.value,
	// 		parent: item.country,
	// 	})),
	// };
	// hierachy = hierarchyArrs.root
	// 	.concat(hierarchyArrs.parents)
	// 	.concat(hierarchyArrs.companies);
	// currentCountries = hierarchyArrs.parents.map(item => item.id);
	// console.log({
	// 	chartData,
	// 	allSum,
	// 	hierarchyArrs,
	// 	hierachy,
	// 	allCountries,
	// 	hideThreshold,
	// 	currentCountries,
	// });
}
