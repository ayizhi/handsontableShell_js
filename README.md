# handsontable_shell_js

实际中运用到handsontable，觉得操作繁琐，复用工作没做完全，所以封装了一个handsontable的套子

运用：

 var targetTable = new HandsonTable($.extend(data,{
                '_Handsontable': theHandsontable,
                'extraData': {
                    type: updateType,
                    id:id,
                },
                '$container': $("#insurance-houseFund-update-history-win .history-table-content"),//容器
                'fixedColumnsLeft': 2, //左边第一列固定不动
                'ajaxUrl': url,
                'searchFields': '', // 搜索范围（列名）,预设
                'searchKeyword': '', //搜索关键词
                'orderField': '', //排序字段， 空,不排序,
                'orderSortKey': 'asc', // asc(小－>大) or desc（大－>小）
                'maxPiece': 8,//显示的最多条数,与表格宽度有关
                'wholeDealBeforeCallback': function (data) {},
                'wholeDealAfterCallback':function(data){}
            }))
            
具体请看源码

其中theHandsontable为handsontable插件对外暴露
