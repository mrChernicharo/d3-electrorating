console.log('Hello Electrorating');

window.addEventListener('resize', () => {
	setDims();
	update();
});

let chartData,
	countryByIndicatorObj,
	indicatorByCountryObj,
	hierachy,
	hierarchyArrs = HIERARCHY_ARRS,
	colors = COLORS,
	selectedYear = 2014,
	selectedIndicator = 'CLIENTES',
	selectedCountries = {},
	currCountries,
	allIndicators,
	interval,
	time = 2000,
	g,
	svg,
	stratify,
	// hideThreshold = 0.001,
	treemap;

$('#year-slider').slider({
	range: false,
	max: 2020,
	min: 1996,
	step: 1,
	slide: (e, ui) => {
		selectedYear = ui.value;
		wrangleData();
		update();
	},
	value: selectedYear,
});
$('button#play').on('click', play);
$('button#pause').on('click', pause);
$('button#reset').on('click', reset);
$('select#indicator').on('change', changeIndicator);

function legendClick(d, i) {
	console.log({ d, i });
	selectedCountries[d] = !selectedCountries[d];
	console.log({ selectedCountries });
	$(`.${d.split(' ').join('-')}.legend-container`).toggleClass('inactive');

	wrangleData();
	update();
}
function play() {
	function step() {
		if (selectedYear !== 2020) {
			selectedYear += 1;
		} else {
			selectedYear = 1996;
		}

		$('button#pause').show();
		$('button#play').hide();
		$('#year-slider').value = selectedYear;

		wrangleData();
		update();
	}
	step();
	interval = setInterval(step, time);
}
function pause() {
	$('button#pause').hide();
	$('button#play').show();
	clearInterval(interval);
}
function reset() {
	selectedYear = 1996;
	$('#year-slider').value = selectedYear;

	wrangleData();
	update();
}
function changeIndicator(e) {
	selectedIndicator = e.target.value;
	wrangleData();
	update();
}

function setDims() {
	margins = { top: 100, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;

	console.log({ height, width, left: margins.left, top: margins.top });
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

function getAllIndicatorsData() {
	const res = {};
	const data = indicatorByCountryObj[selectedYear];

	Object.entries(data).forEach(([cK, cObj]) => {
		res[cK] = [];
		Object.entries(cObj).forEach(([indK, indArr]) => {
			// console.log(indArr);
			res[cK] = [...res[cK], ...indArr];
		});
	});

	return res;
}
function reduceCountriesValues(countriesEntries) {
	const reducedCountriesValues = {};
	Object.keys(countriesEntries).forEach(k => {
		reducedCountriesValues[k] = countriesEntries[k].reduce(
			(acc, o) => (acc += o.value),
			0
		);
	});
	return reducedCountriesValues;
}

function wrangleData() {
	const indicatorsByYear = countryByIndicatorObj[selectedYear];

	const countriesEntries =
		selectedIndicator !== 'Todos'
			? indicatorsByYear[selectedIndicator] || {}
			: getAllIndicatorsData() || {};

	const chartData = Object.entries(selectedCountries)
		.map(([k, v]) => (v === true ? countriesEntries[k] : null))
		.filter(Boolean)
		.flat();

	currCountries = Object.keys(countriesEntries);
	companieValuesSum = d3.sum(chartData, d => d.value);
	reducedCountriesValues = reduceCountriesValues(countriesEntries);
	companieValuesSum = chartData.reduce((acc, o) => (acc += o.value), 0);

	const hierachyObj = {
		root: [{ id: 'Root', parent: '', value: companieValuesSum }],
		parents: Object.entries(reducedCountriesValues).map(([k, v]) => ({
			id: k,
			value: v,
			parent: 'Root',
		})),
		companies: chartData.map(item => ({
			id: item.company,
			value: item.value,
			parent: item.country,
		})),
	};

	hierachy = [...Object.entries(hierachyObj).map(([k, v]) => v)].flat();

	console.log({
		// formatedData,
		// countryByIndicatorObj,
		// indicatorByCountryObj,
		// indicatorsByYear,
		reducedCountriesValues,
		// chartData,
		companieValuesSum,
		// 	currCountries,
		// countriesEntries,
		hierachy,
	});
	console.log('==============================');

	{
		// hierarchyArrs = {
		// 	root: [{ id: 'Root', parent: '', value: companieValuesSum }],
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
		// 	companieValuesSum,
		// 	hierarchyArrs,
		// 	hierachy,
		// 	allCountries,
		// 	hideThreshold,
		// 	currentCountries,
		// });
	}
}
// prettier-ignore
(async function init() {
	setDims();

	const rawData = await d3.dsv(';', '../data/electrorating_indicadores_no_financieros.csv');

	const formatedData = rawData
		.map(item => ({
			id: Number(item[' ']),
			year: Number(item['TIME_Year']),
			indicator: item['INDICATOR_Name'],
			country: item['UTILITY_Country'],
			company: item['UTILITY_Name'],
			valueRaw: Number(item['FACT_INDICATOR_Value']),
			value: Number(item['FACT_INDICATOR_ADJUSTED_Value']),
			valueMag: Number(item['FACT_INDICATOR_Order_Magnitude']),
			doc: item['FACT_INDICATOR_Document'],
			unit: item['UNIT_Name'],
			// theme: item['INDICATOR_Theme'],
		}))
		.filter(item => item.value !== 0);

	countryByIndicatorObj = d3.nest()
		.key(d => d.year)
		.key(d => d.indicator)
		.key(d => d.country)
		.object(formatedData);

	indicatorByCountryObj = d3.nest()		
		.key(d => d.year)
		.key(d => d.country)
		.key(d => d.indicator)
		.object(formatedData);

	allCountries = Array.from(new Set(rawData.map(item => item['UTILITY_Country']))).sort();
	allIndicators = Array.from(new Set(rawData.map(item => item['INDICATOR_Name']))).sort()
	allCompanies = Array.from(new Set(rawData.map(item => item['UTILITY_Name'])));

	allCountries.forEach(c => selectedCountries[c] = true);

	svg = d3.select('svg');

	g = svg.append('g');

	(function () {

		// append-select-options
		['Todos'].concat(Array.from(allIndicators)).forEach(indicator => {
			d3.select('select#indicator')
				.append('option')
				.attr('value', indicator)
				.text(indicator);
		});
		// append-buttons
		d3.select('#countries-legends')
			.selectAll('div')
			.data(allCountries)
			.enter()
			.append('div')
			.attr('class', d => `${d.split(' ').join('-')} legend-container`)
			.attr('title', d => d)
			.text(d => d)
			.on('click', (d, i) => {})
			.on('click', legendClick)
			.append('div')
			.attr('class', 'legend-btn')
			.style('background', (d, i) => `var(--${d.split(' ').join('-')})`);

		$('select#indicator').children().each(function() {
			if ($(this).val() === selectedIndicator) {
				$(this).attr('selected', true)
			}
		})
	})();

	stratify = d3
		.stratify()
		.id(d => d.id)
		.parentId(d => d.parent);

	treemap = (width, height) =>
		d3.treemap().size([width, height]).paddingOuter(1).paddingInner(1);

	console.log({
		rawData,
		allCountries,
		selectedCountries,
		allIndicators,
		allCompanies,
		formatedData,
		countryByIndicatorObj,
		indicatorByCountryObj,
	});

	wrangleData();
	update();
})();

function update() {
	svg.attr('width', width).attr('height', height);
	g.attr('width', width).attr('height', height);

	let root = stratify(hierachy)
		.sum(d => {
			// console.log(d);
			let isLeaf = d.parent && d.parent !== 'Root';
			return isLeaf ? d.value : 0;
		})
		.sort((a, b) => b.value - a.value);
	treemap(width, height)(root);
	// ----------------- TEXT ----------------- ///

	d3.select('g')
		.selectAll('.node')
		.data(root.leaves())
		.join('rect')
		.attr('class', d => {
			return d.depth === 1 ? 'node parent' : 'node';
		})
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.transition()
		.duration(400)
		.attr('title', d => d.id)
		.style('x', d => d.x0 + 'px')
		.style('y', d => d.y0 + 'px')
		.attr('width', d => d.x1 - d.x0 + 'px')
		.attr('height', d => d.y1 - d.y0 + 'px')
		.attr('opacity', d => 0.7)
		.attr('fill', d => {
			if (!d.parent || d.parent.id === 'Root') return 'none';
			return `var(--${d.parent.id.split(' ').join('-')})`;
			// return '#cdcdcd';
		});

	// ----------------- RECTS --------------------------- //
	d3.select('g')
		.selectAll('.node')
		.data([...root.leaves()])
		.join('rect')
		.attr('class', d => {
			return d.depth === 1 ? 'node parent' : 'node';
		});
	// ------------------ LEGENDS ------------------ //
	// d3.select('#countries-legends')
	// 	.selectAll('div')
	// 	.data(allCountries)
	// 	.enter()
	// 	.append('div')
	// 	.attr('class', 'legend-container')
	// 	.attr('title', d => d)
	// 	.text(d => d)
	// 	.append('div')
	// 	.attr('class', 'legend-btn');
	// d3.select('#countries-legends')
	// 	.selectAll('div.legend-btn')
	// 	.data(allCountries)
	// 	.attr('title', d => d);
	// -------------------- EVENTS ----------------------
	$('h1#year-display').text(selectedYear);
	$('#year-slider').slider('value', selectedYear);
	$('.legend-container').each(function (i) {
		if (currCountries.includes(this.innerText)) {
			$(this).css({ display: 'flex' });
		} else {
			$(this).css({ display: 'none' });
		}
	});

	// // prettier-ignore
	// $('#companies-info').text(`${selectedIndicator === 'Todos' ? 'Ocurrencias: ' : 'Companias: '} ${
	// 	hierarchyArrs.companies.filter(item => !inactiveCountries.includes(item.parent)).length}`);
	// // prettier-ignore
	// $('#countries-info').text(`Países: ${hierarchyArrs.parents
	// 	.filter(item => !inactiveCountries.includes(item.id)).length}`);
	// $('#total-info').text(`Valor Acumulado: ${format(companieValuesSum)}`);
	// $('#countries-legends')
	// 	.children()
	// 	.each(function (i) {})
	// 	.children()
	// 	.each(function (i) {
	// 		if (i === 0) console.log($(this), this.classList);
	// 		$(this).css({ background: colors[i] });
	// 	});
}
