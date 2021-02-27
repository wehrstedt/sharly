<template>
  
</template>

<script>
import {
  defineComponent
} from "@vue/composition-api";

export default defineComponent({
  name: "FileUploader",
  props: {
    submit: Boolean
  },

  methods: {
    fileInput (files) {
      if (files) {
        this.$emit("file-selected");
      } else {
        this.$emit("no-file-selected");
      }
    }
  },

  data () {
    return {
      files: null
    };
  },

  watch: {
    submit() {
      if (this.submit) {
        this.$refs.files.submit();
      }
    }
  }
});
</script>
