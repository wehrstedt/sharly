<template>
  <div>
    <div class="q-mt-md text-center">
      <q-btn flat icon="mdi-arrow-left" size="sm" style="position: absolute; left: 0" @click="goback" />
      <div class="text-h6">Inhalt öffnen</div>
      <div class="text-body2">Was möchtest du teilen?</div>

      <div class="row q-pt-xl flex-center">
        <div class="column">
          <q-icon name="mdi-file" size="lg"/>
          <div class="text-body3 q-mt-xs">Datei</div>
        </div>

        <div class="column q-ml-xl">
          <q-icon name="mdi-text-box" size="lg"/>
          <div class="text-body3 q-mt-xs">Text</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent
} from "@vue/composition-api";

export default defineComponent({
  name: "OpenContent",
  methods: {
    goback () {
      this.$emit("go-back");
    }
  },

  setup () {
    return {
    };
  }
});
</script>
