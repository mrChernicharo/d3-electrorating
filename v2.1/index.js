console.log('Hello Electrorating');

window.addEventListener('resize', () => {
	setDims();
	update();
});

let chartData,
	nestedDataObj,
	hierachy,
	hierarchyArrs = HIERARCHY_ARRS,
	colors = COLORS,
	selectedYear = 2014,
	selectedIndicator = 'CLIENTES',
	selectedCountries = {},
	currCounties,
	allIndicators,
	interval,
	time = 2000,
	// hideThreshold = 0.001,
	g,
	svg,
	stratify,
	treemap;

$('#year-slider').slider({
	range: false,
	max: 2020,
	min: 2000,
	step: 1,
	slide: (e, ui) => {
		selectedYear = ui.value;
		wrangleData();
		update();
	},
	value: selectedYear,
});
$('button#play').on('click', e => {
	$('button#pause').show();
	$('button#play').hide();
	play();
});
$('button#pause').on('click', e => {
	$('button#pause').hide();
	$('button#play').show();
	pause();
});
$('button#reset').on('click', e => reset());
$('select#indicator').on('change', e => {});

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
			selectedYear = 2000;
		}

		$('#year-slider').value = selectedYear;

		wrangleData();
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
	$('#year-slider').value = selectedYear;

	wrangleData();
	update();
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

	console.log({ height, width, left: margins.left, top: margins.top });
}

function wrangleData() {
	const yearData = nestedDataObj[selectedYear];
	const indicatorData = yearData[selectedIndicator];

	const chartData = Object.entries(selectedCountries)
		.map(([k, v]) => v === true && indicatorData[k])
		.filter(Boolean)
		.flat();

	currCounties = Object.keys(indicatorData);
	companieValuesSum = chartData.reduce((acc, o) => (acc += o.value), 0);

	console.log({
		// formatedData,
		// nestedDataObj,
		// yearData,
		chartData,
		companieValuesSum,
		currCounties,
		indicatorData,
	});
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

	const rawData = await d3.dsv(';', '../electrorating_indicadores_no_financieros.csv');

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

	nestedDataObj = d3
		.nest()
		.key(d => d.year)
		.key(d => d.indicator)
		.key(d => d.country)
		.object(formatedData);

	allCountries = Array.from(new Set(rawData.map(item => item['UTILITY_Country'])));
	allIndicators = Array.from(new Set(rawData.map(item => item['INDICATOR_Name'])));
	allCompanies = Array.from(new Set(rawData.map(item => item['UTILITY_Name'])));

	allCountries.forEach(c => selectedCountries[c] = true);

	svg = d3.select('svg');

	g = svg.append('g');

	// append-buttons
	(function () {
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
	});

	wrangleData();
	update();
})();

function update() {
	{
		// let root = stratify(hierachy)
		// 	.sum(d => {
		// 		let isLeaf =
		// 			d.parent &&
		// 			d.parent !== 'Root' &&
		// 			!inactiveCountries.includes(d.parent);
		// 		return isLeaf ? d.value : 0;
		// 	})
		// 	.sort((a, b) => b.value - a.value);
		// treemap(width, height)(root);
		// ----------------- TEXT ----------------- ///
		// d3.select('#chart-area')
		// 	.selectAll('.text-div')
		// 	.data([...root.leaves()])
		// 	.join('div');
		// ----------------- RECTS --------------------------- //
		// d3.select('g')
		// 	.selectAll('.node')
		// 	.data([...root.leaves()])
		// 	.join('rect')
		// 	.attr('class', d => {
		// 		return d.depth === 1 ? 'node parent' : 'node';
		// 	});
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
	}
	$('h1#year-display').text(selectedYear);
	$('#year-slider').slider('value', selectedYear);
	$('.legend-container').each(function (i) {
		if (currCounties.includes(this.innerText)) {
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
