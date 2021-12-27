<template>
  <div class="form-area">
    <el-form ref="commonDataShow" class="common-form" :model="formData" :label-width="formLabelWidth" @submit.native.prevent>
      <el-form-item :label="item.name" v-for="(item, index) in dataShowSetting" :key="index">
        <div v-if="item.html" v-html="formatValue(item)"></div>
        <div v-else-if="item.link">
          <a :href="formatValue(item)" v-if="formData[item.key]">点击查看</a>
        </div>
        <span v-else v-text="formatValue(item)">
        </span>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
export default {
  name: 'commonDataShow',
  props: {
    dataShowSetting: { // 展示数据信息
      type: Array,
      default: () => {
        return []
      }
    },
    formData: { // 表单数据
      type: Object,
      default: () => {
        return {}
      }
    },
    formLabelWidth: {
      type: String,
      default: '120px'
    }
  },
  data () {
    return {

    }
  },
  mounted () {
  },
  methods: {
    formatValue (item) {
      if (item.formatter) {
        return item.formatter(this.formData[item.key])
      }
      return this.formData[item.key]
    }
  }
}
</script>
