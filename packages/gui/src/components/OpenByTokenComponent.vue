<template>
  <div>
    <q-card class="my-card">
      <q-card-section>
        <div class="text-h6">Inhalt öffnen</div>
      </q-card-section>

      <q-card-section>
        Gib deinen Token ein, um den geteilten Inhalt zu öffnen:
        <q-input v-model="token" label="Token" class="q-pb-md" />
        <q-btn color="black" class="full-width" label="Öffnen" />
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import {
  defineComponent
} from "@vue/composition-api";

export default defineComponent({
  name: "OpenByTokenComponent",
  setup () {
    return {
      token: ""
    };
  }
});
</script>
