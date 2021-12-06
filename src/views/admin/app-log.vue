<template>
  <d2-container>
    <div class="search-area">
      <el-form :inline="true" :model="search">
        <el-form-item label="内容" @keyup.enter.native="getList(true)">
          <el-input clearable size="mini" v-model="search.message" placeholder="请输入" :disabled="searchDisabled"/>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="search.level" placeholder="请选择" @change="getList(true)" size="mini" clearable :disabled="searchDisabled">
            <el-option value="ERROR">ERROR</el-option>
            <el-option value="WARN">WARN</el-option>
            <el-option value="INFO">INFO</el-option>
            <el-option value="DEBUG">DEBUG</el-option>
            <el-option value="TRACE">TRACE</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属项目">
          <el-select v-model="search.projectName" placeholder="请选择" @change="getList(true)" size="mini" :disabled="searchDisabled">
            <el-option v-for="(item, index) in projectNamesList" :value="item.label" :key="index">{{item.label}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务器地址">
          <el-select v-model="search.sourceFrom" placeholder="请选择" @change="getList(true)" size="mini" clearable :disabled="searchDisabled">
            <el-option v-for="(item, index) in sourceFromList" :value="item.label" :key="index">{{item.label}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="class">
          <el-input clearable size="mini" v-model="search.clazz" placeholder="请输入" @keyup.enter.native="getList(true)" :disabled="searchDisabled"/>
        </el-form-item>
        <el-form-item label="表格显示">
          <el-switch
            :disabled="searchDisabled"
            v-model="search.showTable"
            active-color="#13ce66"
            inactive-color="#ff4949">
          </el-switch>
        </el-form-item>
        <el-form-item label="自动刷新" v-if="!search.showTable">
          <el-switch
            v-model="search.autoRefresh"
            @change="autoRefresh"
            active-color="#13ce66"
            inactive-color="#ff4949">
          </el-switch>
          <i v-if="search.autoRefresh" class="fa fa-refresh fa-spin fa-fw" style="color: #13ce66"></i>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="search.showTable">
      <CommonTable :tableData="tableData" :tableLoading="tableLoading" :tableHeader="tableHeader" :isShowOperation="false">
        <template slot="operate" slot-scope="{ row }">
          <TableOperation :operation-list="tableOperationList(row)"/>
        </template>
      </CommonTable>
      <!-- 分页组件  -->
      <div class="el-page">
        <el-pagination :current-page="pager.currentPage" :page-sizes="pageSizes" :page-size="pager.pageSize"
                       :layout="pagerSetting" :total="pager.totalCount" @size-change="handlePageSizeChange"
                       @current-change="handleCurrentChange"/>
      </div>
    </div>
    <div v-if="!search.showTable" v-loading="infiniteLoading">
      <pre class="d2-highlight hljs"  v-html="highlightContent"   v-infinite-scroll="loadMore" :infinite-scroll-disabled="infiniteDisabled"></pre>
      <el-backtop target=".d2-highlight" :right="100" :bottom="100" ref="backtop">UP</el-backtop>
    </div>
  </d2-container>
</template>
<script>
import highlight from 'highlight.js'
import '@/components/d2-highlight/libs/vscode.css'
import CommonTable from '@/components/common-page/commonTable.vue'
import TableOperation from '@/components/common-page/tableOperation.vue'
export default {
  name: 'admin-clients',
  components: {
    CommonTable,
    TableOperation
  },
  data() {
    return {
      searchList: [{
        key: 'clazz',
        name: 'class',
        type: 'input'
      }, {
        key: 'level',
        name: '日志级别',
        type: 'input'
      }, {
        key: 'message',
        name: '日志内容',
        type: 'input'
      }, {
        key: 'projectName',
        name: '所属项目',
        type: 'input'
      }, {
        key: 'sourceFrom',
        name: '服务器地址',
        type: 'input'
      }],
      tableHeader: [{
        prop: 'createTime',
        label: '时间'
      }, {
        prop: 'level',
        label: '日志级别',
        html: true,
        formatter: function (value) {
          if (value === 'ERROR') {
            return "<span style='color: red'>" + value + '</span>'
          } else {
            return value
          }
        }
      }, {
        prop: 'pid',
        label: 'pid'
      }, {
        prop: 'threadName',
        label: '线程名'
      }, {
        prop: 'clazz',
        label: '日志类'
      }, {
        prop: 'message',
        label: '内容',
        openPopover: true
      }, {
        prop: 'projectName',
        label: '所属项目'
      }, {
        prop: 'sourceFrom',
        label: '日志来源'
      }], // 表头配置
      search: {
        id: '', // 游标id
        showTable: false,
        autoRefresh: false,
        projectName: 'quchuang-admin'
      },
      formSettingInfo: [], // 表单配置
      formData: {}, // 表单数据
      formRules: {}, // 表单必填项配置
      pager: { // 分页插件配置
        totalCount: 0,
        pageCount: 1,
        pageSize: 100,
        currentPage: 0
      },
      highlightContent: '',
      infiniteDisabled: false,
      infiniteLoading: false,
      searchDisabled: false,
      intervalPid: '',
      projectNamesList: [],
      sourceFromList: [],
      lastTotalCount: 0, // 启动自动刷新最后一次分页数
      pageSizes: [15, 20, 40, 60, 100],
      pagerSetting: 'total, sizes, prev, pager, next, jumper',
      tableData: [], // 表格数据
      tableLoading: false, // 表格loading动画
      dialogFormVisible: false, // 弹窗是否展示
      listPath: '/admin/appLog/pageList', // 列表请求地址
      savePath: '', // 保存地址
      deletePath: ''// 删除地址
    }
  },
  watch: {
    'search.showTable': {
      handler (val, oldVal) {
        if (val !== oldVal) {
          this.getList(true)
        }
        if (val && this.intervalPid) {
          clearInterval(this.intervalPid)
        }
      },
      deep: true
    }
  },
  created() {
    this.getEnum()
  },
  methods: {
    /**
     * flag 是否返回第一页
     * @param flag
     */
    getList(flag) { // 列表请求
      this.tableLoading = true
      if (flag) {
        this.pager.currentPage = 1
        this.search.id = ''
        this.highlightContent = ''
      }
      const params = Object.assign({}, this.search, {
        pageSize: this.pager.pageSize,
        currentPage: this.pager.currentPage
      })
      this.$get(this.listPath, params).then(res => {
        this.tableLoading = false
        if (res.code === 1) {
          if (this.search.showTable) {
            this.tableData = res.data.list
          } else {
            if (res.reserveData.value) {
              this.$message.warning('向下浏览已失效，重回第一页开始浏览')
              this.getList(true)
              return
            }
            if (res.reserveData.label) {
              this.highlightContent = this.highlightContent + highlight.highlightAuto(res.reserveData.label, [
                'java',
                'html',
                'javascript',
                'json',
                'css',
                'scss',
                'less'
              ]).value
              this.infiniteDisabled = false
            } else {
              this.highlightContent = this.highlightContent + "<span style='color: red'>已无更多内容</span>"
              this.infiniteDisabled = true
            }
          }
          this.infiniteLoading = false
          this.search.id = res.reserveData.name
          this.pager.totalCount = res.data.totalCount
          this.pager.pageCount = res.data.pageCount
          this.pager.pageSize = res.data.pageSize
          this.pager.currentPage = res.data.currentPage
        }
      }).catch(_ => {
        this.tableLoading = false
      })
    },
    tableOperationList(row) { // 表格操作配置
      return []
    },
    deleteData(row) { // 删除按钮
      this.$confirm('确定删除吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$get(this.deletePath + '/' + row.id).then(res => {
          if (res.code === 1) {
            this.$message({
              message: '删除成功！',
              type: 'success'
            })
            this.getList(true)
          }
        })
      })
    },
    handleCurrentChange(val) {
      this.pager.currentPage = val
      this.getList()
    },
    handlePageSizeChange(val) {
      this.pager.pageSize = val
      this.getList(true)
    },
    getEnum() {
      this.$get('/admin/appLog/getEnum').then(res => {
        if (res.code === 1) {
          this.projectNamesList = res.data.projectName
          this.sourceFromList = res.data.sourceFrom
        }
      })
    },
    loadMore() {
      this.infiniteLoading = true
      this.pager.currentPage = this.pager.currentPage + 1
      this.getList()
    },
    refreshData() {
      this.$get('/admin/appLog/autoRefresh', {
        totalCount: this.pager.totalCount,
        projectName: this.search.projectName
      }).then(res => {
        if (res.reserveData && res.reserveData.label && res.data.totalCount > this.pager.totalCount) {
          this.highlightContent = highlight.highlightAuto(res.reserveData.label, [
            'java',
            'html',
            'javascript',
            'json',
            'css',
            'scss',
            'less'
          ]).value + this.highlightContent
          this.pager.totalCount = res.data.totalCount
        }
      })
    },
    autoRefresh() {
      if (this.search.autoRefresh) {
        this.searchDisabled = true
        this.infiniteDisabled = true
        this.intervalPid = setInterval(() => {
          this.refreshData()
        }, 2000)
      } else {
        this.searchDisabled = false
        clearInterval(this.intervalPid)
        this.intervalPid = ''
      }
    }
  }
}
</script>
