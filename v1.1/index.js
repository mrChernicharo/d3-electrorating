console.log('Hello Electrorating');

let formatedData,
	dataByYear,
	chartData,
	selectedProp = 'year',
	selectedYear = 2010;

d3.dsv(';', '../data/electrorating_indicadores_financieros.csv').then(data => {
	console.log(data);

	setInterval(() => {
		selectedYear = selectedYear === 2020 ? 2000 : selectedYear + 1;
		// console.log(selectedYear);
		wrangleData(data);
		update();
	}, 1000);
});

function update() {
	// console.log(chartData);
}

function dataFormat(data) {
	return data.map(item => ({
		value: Number(item['FACT_INDICATOR_Value_USD']),
		localValue: Number(item['FACT_INDICATOR_Value_Local']),
		year: Number(item['TIME_Year']),
		country: item['UTILITY_Country'],
		company: item['UTILITY_Name'],
		indicator: item['INDICATOR_Name'],
	}));
}

function reduceBy(key, data) {
	return data.reduce((acc, player) => {
		acc[player[key]]
			? (acc[player[key]] += player.value)
			: (acc[player[key]] = player.value);
		return acc;
	}, {});
}

function format(val) {
	return d3.format('~s')(val * 1_000_000);
}

function resize(e) {
	update(getFinalData(formatedData));
}

function setDims() {
	margins = { top: 100, left: window.innerWidth / 20 };
	width = window.innerWidth - margins.left * 2;
	height = window.innerHeight - margins.top * 2;
}

function wrangleData(data) {
	formatedData = dataFormat(data);
	dataByYearObj = d3
		.nest()
		.key(d => d.year)
		.object(formatedData);
	// filteredData = getFilteredData(formatedData);
	// console.log({ dataByYearObj });
	// console.log({ formatedData });
	// console.log({ formatedData, filteredData });
	chartData = dataByYearObj[selectedYear];
}

// function getFilteredData(formatedData) {
// 	const allSum = formatedData.reduce((a, b) => (a += b.value), 0);

// 	const reducedByPropObj = reduceBy(selectedProp, formatedData);
// 	console.log({ reducedByPropObj });

// 	byPropArr = Object.entries(reducedByPropObj).map(([k, v]) => ({
// 		id: k,
// 		value: v,
// 		parent: 'Root',
// 	}));
// 	console.log({ byPropArr });

// 	const companysByPropArr = formatedData.map(company => {
// 		const parentNode = byPropArr.find(
// 			node => node.id === String(company[selectedProp])
// 		);
// 		return {
// 			id: company.company,
// 			value: company.value,
// 			parent: parentNode.id,
// 		};
// 	});
// 	// items = byProp.map(item => item.id);
// 	const hierarchy = [{ id: 'Root', parent: '', value: allSum }]
// 		.concat(byPropArr)
// 		.concat(companysByPropArr);

// 	console.log({ reducedByPropObj, byPropArr, allSum, hierarchy });

// 	return hierarchy;
// }
