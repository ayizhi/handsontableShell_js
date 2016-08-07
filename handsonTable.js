
//obj参数{$container:$dom , fixedColumnsLeft:'','cells':callback ,'ajaxUrl':'' }
function HandsonTable(obj){
    var t = this;

    t.Handsontable = obj['_Handsontable'];

    //基本数据
    t.reportHeader = [];//表头,接受data['report_header'][i]中的'field_name'字段;
    t.reportCol = [];//接受data['report_header'][i]中的'field'字段,形式为[{data:['report_header'][i]['field']}]
    t.reportData = [];//表中数据;
    t.pageLimit = '';//页面最多条数
    t.pageNum = '';//当前页数
    t.totalPageNum = '';//总体页数
    t.maxPiece = obj['maxPiece'] || 10;//最大条数


    //需要提交的额外数据
    t.extraData = obj['extraData'] || {};

    //功能
    t.searchFields = obj['searchFields'] || ''; // 搜索范围（列名）,预设
    t.searchKeyword = obj['searchKeyword'] || ''; //搜索关键词
    t.order_field = obj['order_field'] || '';//排序的字段名k值
    t.order_sort_key = 'asc';//排序的顺序,初始化是asc正序,desc为倒序

    //dom
    t.$reportContainer = obj['$container'] ;//容器
    t.reportTable = {};//表体

    //table设置
    t.fixedColumnsLeft = obj['fixedColumnsLeft'] || 1;
    t.ajaxUrl = obj['ajaxUrl'] || '';//获取table的ajaxurl;


    //阀值变量
    t.loadingController = false;

    //功能回调
    t.cellCallback = obj['cellCallback'];//针对单元格操作
    t.wholeDealBeforeCallback = obj['wholeDealBeforeCallback'];//初始化,滚动加载,排序,搜索都要涉及到的,在建立之前
    t.wholeDealAfterCallback = obj['wholeDealAfterCallback'];//全部的回调,在建立之后
    t.loadMoreDataCallback = obj['loadMoreDataCallback'] //加载更多信息的回调
    t.getTableCallback = obj['getTableCallback']//排序.搜索的回调
    t.afterRenderer = obj['afterRenderer']//渲染过后

    //初始化
    t.init(obj);
    t.bindEvent();

}

HandsonTable.prototype = {

    init: function(data){
        var t = this;
        //表数据
        t.reportData = data['report_data']; // 表数据 [{email: 'abc@abc.com', name: '**',...},...]
        t.pageLimit = data['limit'] || 50;
        t.pageNum = data['page_num'] || 1;
        t.totalPageNum = data['total_page_num'];
        //清空
        t.reportHeader = [];
        t.reportCol = [];

        //如果数据为空则返回
        if(!t.reportData.length){
            return
        }

        //处理header与col
        (function(){
            for(var i = 0,len = data['report_header'].length; i<len; i++){
                var thisData = data['report_header'][i];
                t.reportHeader.push(thisData['field_name'] + '<i class="icon-sort"></i>');
                t.reportCol.push({'data':thisData['field']});
            }
        })();

        //需要在所有表格操作中执行的函数
        if(t.wholeDealBeforeCallback){
            t.wholeDealBeforeCallback.call(t,data);
        }


        //判断是否存在,存在摧毁
        if(t.$reportContainer.find('.handsontable').size()) {
            t.$reportContainer.find('.handsontable').remove();
        }

        // new出来handsontabl
        t.reportTable = new t.Handsontable(t.$reportContainer.get(0), {
            data: t.reportData,
            rowHeaders: true,
            columns: t.reportCol,
            colHeaders: t.reportHeader,
            wordWrap: false,
            width: t.$reportContainer.width(),
            height: function(){
                if(t.reportData.length > t.maxPiece) {
                    return (50 + 40 * t.maxPiece);
                } else {
                    return (50 + 40 * (t.reportData.length + 1))
                }
            },
            stretchH:'all',
            autoColumnSize: true,
            autoWrapRow: true,
            fixedColumnsLeft: t.fixedColumnsLeft,
            readOnly:true,
            disableVisualSelection: true,
            afterScrollVertically: _compute_window,
            afterRender:true,
            afterRenderer:function(td,row,col,prop,value,cellproperties){
                if(t.afterRenderer){
                    t.afterRenderer.call(t,td,row,col,prop,value,cellproperties)
                }
            },
            cells: function(row,col,prop){
                if(t.cellCallback){
                    var _this = this;
                    if(t.cellCallback){
                        t.cellCallback(row,col,prop,_this);
                    }
                }
            }
        });
        //滚动加载
        function _compute_window(){
            var rowCount = t.reportTable.countRows();
            var rowOffset = t.reportTable.rowOffset();
            var visibleRows = t.reportTable.countVisibleRows();
            //var lastRow = rowOffset + (visibleRows * 1);
            var lastVisibleRow = rowOffset + visibleRows + (visibleRows/2);
            var threshold = 20;

            if(lastVisibleRow > (rowCount - threshold)) {
                t.loadMoreData();
            }
        }



        if(t.wholeDealAfterCallback){
            t.wholeDealAfterCallback.call(t,data);
        }

        //执行一些回调
        if(t.getTableCallback){
            t.getTableCallback.call(t,data);
        }
    },

    //callback每次加载数据后的回调,类似控制变灰;
    loadMoreData: function(){
        var t = this;
        var moreData = [];
        if(t.pageNum < t.totalPageNum && (!t.loadingController)) {
            t.loadingController = true;
            //页数自加1
            t.pageNum = +t.pageNum + 1;
            ajaxMask.open();
            $.ajax({
                url: t.ajaxUrl,
                type: 'post',
                data: $.extend({
                    'order_field': t.order_field,
                    'order_sort_key': t.order_sort_key,
                    'search_keyword': t.searchKeyword,
                    'search_fields': t.searchFields,
                    'page_limit': t.pageLimit,
                    'page_num': t.pageNum, //获取下一页

                }, t.extraData),
                success: function(reply){
                    t.loadingController = false;
                    ajaxMask.close();

                    if(!reply.status){
                        remind('error', reply.message);
                        return false;
                    }

                    //如果没数据
                    if(!reply.data['report_data'].length){
                        return;
                    }

                    moreData = reply.data['report_data'];
                    if (moreData) {
                        moreData.forEach(function (d) {
                            t.reportData.push(d);
                        });
                    }

                    //需要在所有表格操作中执行的函数
                    if(t.wholeDealBeforeCallback){
                        t.wholeDealBeforeCallback.call(t,reply.data);
                    }


                    t.reportTable.render();

                    //执行回调
                    if(t.loadMoreDataCallback){
                        t.loadMoreDataCallback.call(t,reply.data);
                    }

                    if(t.wholeDealAfterCallback){
                        t.wholeDealAfterCallback.call(t,reply.data);
                    }
                }
            });
        }
    },

    //用于排序,搜索等等,向外仅会用到搜索
    getTable:function(callback){
        var t = this;
        //需要把pageNum初始化
        t.pageNum = 1;
        ajaxMask.open();
        $.ajax({
            url: t.ajaxUrl,
            type: 'post',
            data: $.extend({
                'order_field': t.order_field,
                'order_sort_key': t.order_sort_key,
                'search_fields': t.searchFields,
                'search_keyword': t.searchKeyword,
                'page_limit': t.pageLimit,
                'page_num': t.pageNum, //获取下一页
            }, t.extraData),
            success: function (reply) {
                ajaxMask.close();
                if(!reply.status){
                    remind('error',reply.message);
                    return
                }

                if(!reply.data.report_data){
                    return;
                }

                //需要在所有表格操作中执行的函数
                if(t.wholeDealBeforeCallback){
                    t.wholeDealBeforeCallback.call(t,reply.data);
                }

                t.init(reply.data);

            }
        })
    },

    //绑定一些特定事件
    bindEvent:function(){
        var t = this;
        //点击报表头排序
        t.$reportContainer.on('click','.handsontable thead th',function(){
            var self = this;
            t._tableSort.call(t,self)
        });

    },

    //排序的内部函数
    _tableSort:function(self){
        var t = this;//整个类的this(指向类)
        var $self = $(self);//事件的this(指向事件)
        var colIndex = $self.index();
        if(colIndex == 0){
            return
        }
        if(t.order_field == t.reportCol[colIndex - 1].data){
            t.order_sort_key = t.order_sort_key == 'asc'? 'desc':'asc'
        }else{
            t.order_sort_key = 'asc';
            t.order_field = t.reportCol[colIndex -1].data;
        }
        t.getTable();
    },





}
