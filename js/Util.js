function formatData(date) {
	if (typeof date == 'undefined' || date == 'undefined') {
		return "";
	}
	var newDate = new Date();
	newDate.setTime(date);
	return newDate.getFullYear() + '年' + (newDate.getMonth()+1) + '月' + newDate.getDate() + '日';
}

function replaceReturn(data) {
	if(data == null || typeof data !== 'string') {
		return '';
	}
//	console.log("before:"+data);
	var after = data.replace(/[\n]/g,"");
//	console.log("after:"+after);
	return after;
}

function getCurrentDateTime() {
	var seperator1 = "-";
	var seperator2 = ":";
	
	var date = new Date();
	var month = date.getMonth() + 1;
	var strDate = date.getDate();
	if(month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if(strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	return date.getFullYear() + seperator1 + month + seperator1 + strDate +
		" " + date.getHours() + seperator2 + date.getMinutes() +
		seperator2 + date.getSeconds();

}
