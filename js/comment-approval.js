/**
 * 
 * @param {String} showCountSelector 显示选中数量元素选择器
 * @param {String} allCheckboxId 全选框id选择器
 * @param {String} checkboxName 复选框name属性
 * @param {String} selector 复选框选择器
 */
function addCheckBoxListener(showCountSelector, allCheckboxId, checkboxName, selector) {
	mui('.bottom-div-select').on('tap', allCheckboxId, function() {
		var checked = $(allCheckboxId).is(':checked');
//		console.log('checked:'+checked);
		if(checked){
			$("[name = "+checkboxName+"]:checkbox").prop("checked", false);		
			$(showCountSelector).text("0");
		}else{
			$("[name = "+checkboxName+"]:checkbox").prop("checked", true);
			$(showCountSelector).text($(selector).length);
		}
	});
	
	mui('.mui-content').on('tap', selector, function() {
		var checked = $(this).is(':checked');
		var indexs = $("[name = "+checkboxName+"]:checked").length;
		var checkItems = $(selector).length;
		//如果为选中状态，点击事件以后，应该为未选中状态，以选中数量需减1，反之，加1
		if(checked) {
			indexs = indexs -1; 
		} else {
			indexs = indexs + 1;
		}
//		console.log(checked +"?"+indexs +":" + checkItems);
		$(allCheckboxId).prop("checked", indexs === checkItems);
		$(showCountSelector).text(indexs);
	});
}
/**
 * 打开审批意见对话框 
 * @param {String} id textarea id名称
 * @param {String} defaultValue 默认值
 * @param {Function} callback
 */
function openCommentDialog(id, defaultValue, callback) {
	if(typeof defaultValue === 'undefined' || defaultValue == null || defaultValue == 'undefined') {
		defaultValue = '';
	}
	layer.open({
		title: '审批意见',
		content: '<textarea id="' + id + '" placeholder="请填写审批意见">' + defaultValue + '</textarea>',
		shadeClose: false,
		btn: ['确定', '取消'],
		yes: callback
	});
};

/**
 * 审批
 * @param {String} result 审批结果
 * @param {String} billdefine 单据定义标识
 * @param {Array} billIds 单据id集合
 * @param {String} comment 意见
 * @param {String} otherParam 其它参数
 * @param {Function} beforeApproval 审批前调用函数，该函数返回值应为boolean
 * @param {Function} afterApproval 审批后调用函数
 */
function approval(result, billdefine, billIds, workItems, comment, otherParam, beforeApproval, afterApproval) {
	if(!beforeApproval()) {
		return;
	}
	plus.nativeUI.showWaiting();
	var failureCount = 0;
	var successCount = 0;

	for(var i = 0; i < billIds.length; i++) {
		var params = $jqzw_server.buildParams('SdSfDxNeedToDoService', 'InsertBoolean', billIds[i], result, billdefine, workItems[i], comment, otherParam);
		$jqzw_server.syncCallServer(params, function(iv) {
			console.log(JSON.stringify(iv));
			failureCount += 1;
		}, function(iv) {
			if(iv === false || iv === 'false') {
				failureCount += 1;
			} else {
				successCount += 1;
			}
		}, null);
	}
	plus.nativeUI.closeWaiting();
	mui.toast('本次共审批' + billIds.length + '张单子，\n审批成功' + successCount + '张，审批失败' + failureCount + '张');
	afterApproval();
}

/**
 * 
 * @param {String} selector
 */
function getSelectItems(selector) {
	var ptguids = [];
	var recids = [];

	var checkItems = $(selector);
	for(var i = 0; i < checkItems.length; i++) {
		if($(checkItems[i]).is(':checked')) {
			var indexs = $(checkItems[i]).attr("id").replace(/[^0-9]/ig, "");
			recids.push(DisPoasalList[indexs].recid);
			ptguids.push(DisPoasalList[indexs].ptguid);
		}
	}
	return [recids, ptguids];
}

/**
 * 
 * @param {String} selector 复选框class标识
 * @param {Boolean} requireComment 意见是否必填
 * @param {String} dialogCommentId 意见div id标识
 * @param {String} defaultComment 默认意见
 * @param {String} billdefine 单据定义标识
 * @param {Function} beforeApproval 审批前调用函数，该函数返回值应为boolean
 * @param {Function} afterApproval 审批后调用函数
 */
function agree(selector, requireComment, dialogCommentId, defaultComment, billdefine, otherParam, beforeApproval, afterApproval) {
	var ids = getSelectItems(selector);
	var recids = ids[0];
	var ptguids = ids[1];
	if(ptguids.length == 0) {
		mui.toast("请选择要同意的选项");
		return;
	}

	if(requireComment) {
		openCommentDialog(dialogCommentId, defaultComment, function() {
			var commentText = $.trim($("#" + dialogCommentId).val());
			if(commentText == "") {
				mui.toast('请填写审批意见');
				return false;
			}

			approval("true", billdefine, recids, ptguids, commentText, otherParam, beforeApproval, afterApproval);
		});
	} else {
		approval("true", billdefine, recids, ptguids, '', otherParam, beforeApproval, afterApproval);
	}
}

/**
 * 
 * @param {String} selector 复选框class标识
 * @param {Boolean} requireComment 意见是否必填
 * @param {String} dialogCommentId 意见div id标识
 * @param {String} defaultComment 默认意见
 * @param {String} billdefine 单据定义标识
 * @param {Function} beforeApproval 审批前调用函数，该函数返回值应为boolean
 * @param {Function} afterApproval 审批后调用函数
 */
function reject(selector, requireComment, dialogCommentId, defaultComment, billdefine, otherParam, beforeApproval, afterApproval) {
	var ids = getSelectItems(selector);
	var recids = ids[0];
	var ptguids = ids[1];
	if(ptguids.length == 0) {
		mui.toast("请选择要驳回的选项！");
		return;
	}

	if(requireComment) {
		openCommentDialog(dialogCommentId, '', function() {
			var commentText = $.trim($("#" + dialogCommentId).val());
			if(commentText == "") {
				mui.toast("请填写审批意见");
				return false;
			}
			approval("false", billdefine, recids, ptguids, commentText, otherParam, beforeApproval, afterApproval);
		});
	} else {
		approval("false", billdefine, recids, ptguids, '', beforeApproval, otherParam, afterApproval);
	}
}

function showApprovalTrace(pagePath, tableName, data) {
	if(typeof pagePath === 'undefined' || pagePath == null) {
		pagePath = '../shenpi/AssetTrajectory.html';
	}
	mui.openWindow({
		url: pagePath,
		id: 'AssetTrajectory',
		styles: {
			popGesture: 'close',
			scrollIndicator: "none"
		},
		show: {
			aniShow: aniShow
		},
		waiting: {
			autoShow: false
		},
		extras: {
			DisPosal: data,
			biaoming: tableName
		}
	});
}

function showBillDetail(pagePath, tableName, billdefine, srcPageId, data, showFields) {
	if(typeof pagePath === 'undefined' || pagePath == null || pagePath === '') {
		pagePath = '../shenpi/ViewDetails.html';
	}
	var fields = [{"fieldName":"billcode", "fieldTitle":"单据编号"},{"fieldName":"billtime", "fieldTitle":"单据时间"}];
	if(typeof showFields!='undefined' || showFields != null) {
		fields = showFields;
	}
	mui.openWindow({
		url: pagePath,
		id: 'ViewDetails',
		styles: {
			popGesture: 'close',
			scrollIndicator: "none"
		},
		show: {
			aniShow: aniShow
		},
		waiting: {
			autoShow: false
		},
		extras: {
			DisPosal: data,
			biaoming: tableName,
			biaos: billdefine,
			html: srcPageId,
			showFields: fields
		}
	});
}