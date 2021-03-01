<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
.body--light {
  background-color: #303443
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "MainLayout",
  components: { }
});
</script>
