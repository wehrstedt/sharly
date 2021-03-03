<template>
  <q-layout view="hHh lpR lff">
    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="q-pa-md text-center">
      {{ $t('slogan_1') }}<br />
      {{ $t('slogan_2') }}
    </q-footer>
  </q-layout>
</template>

<style>
.body--light {
  background-color: #303443;
}
</style>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "MainLayout",
  components: {},
});
</script>
