<template>
  <div class="row full-width items-center justify-evenly">
    <q-dialog v-model="errorDlg" position="bottom">
      <q-card style="width: 350px">
        <q-card-section class="row items-center no-wrap">
          <q-icon name="mdi-emoticon-sad" />
          <span class="text-weight-bold q-ml-sm"
            >Es wurde kein Inhalt für dieses Token gefunden!</span
          >
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="confirmCopyToClipboard" position="bottom">
      <q-card style="width: 350px">
        <q-card-section class="row items-center no-wrap">
          <q-icon name="mdi-check" />
          <span class="text-weight-bold q-ml-sm">{{
            confirmCopyToClipboardText
          }}</span>
        </q-card-section>
      </q-card>
    </q-dialog>

    <div class="row q-mt-md">
      <q-btn
        flat
        icon="mdi-arrow-left"
        size="sm"
        style="position: absolute; left: 0"
        @click="goback"
      />
      <div class="text-h6">Inhalt öffnen</div>
    </div>

    <q-form class="row q-pt-xs full-width" ref="tokenForm" v-if="!token">
      <q-input
        flat
        label="Token"
        ref="tokenId"
        class="full-width"
        :rules="[(val) => !!val || 'Bitte gib einen Token ein.']"
        v-model="tokenId"
        @keyup="tokenIdKeyUp"
      />
      <q-btn
        icon-right="mdi-lock-open"
        color="primary"
        label="Öffnen"
        class="full-width q-mt-xs"
        @click="openToken"
        :disabled="disableOpenTokenBtn"
      />
    </q-form>

    <q-form class="row q-pt-md full-width q-pt-md q-pb-md" v-if="token">
      <div class="column col-10">
        <span class="text-subtitle2" style="display: inline-block"
          >Geteilter Text:</span
        >
      </div>

      <div class="column col-2">
        <q-btn
          flat
          round
          icon="mdi-clipboard-multiple-outline"
          class="float-right"
          size="sm"
          @click="copySharedTextToClipboard"
        />
      </div>

      <div class="row full-width">
        {{ token.text }}
      </div>
    </q-form>

    <q-form
      class="row q-pt-xs full-width"
      v-if="token && token.files.length > 0"
    >
      <div class="column col-10">
        <span class="text-subtitle2" style="display: inline-block"
          >Dateien:</span
        >
      </div>

      <div class="row full-width">
        <q-item
          v-for="file in token.files"
          :key="file.path"
          clickable
          class="q-pl-none"
          @click="downloadFile(file.path)"
        >
          <q-item-section avatar>
            <q-icon name="mdi-file" />
          </q-item-section>

          <q-item-section>{{ file.name }}</q-item-section>
        </q-item>
      </div>
    </q-form>

    <q-btn
      icon="mdi-close"
      color="primary"
      label="Schließen"
      class="full-width q-mt-xs"
      @click="
        token = null;
        tokenId = '';
        goback();
      "
      v-if="token"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { api as backend, Token } from "../boot/backend";
import { copyToClipboard } from "quasar";

export default defineComponent({
  name: "OpenContent",
  methods: {
    copySharedTextToClipboard() {
      copyToClipboard(this.token.text).then(() => {
        this.confirmCopyToClipboardText = "Text kopiert!";
        this.confirmCopyToClipboard = true;
        setTimeout(() => {
          this.confirmCopyToClipboard = false;
        }, 2000);
      });
    },

    downloadFile(filePath: string) {
      if (filePath) {
        backend.downloadFile(filePath).then((result) => {
          const url = window.URL.createObjectURL(new Blob([result as any]));
          const link = document.createElement("a");
          link.href = url;

          const fileName = this.token.files.filter(
            (f) => f.path === filePath
          )[0].name;
          link.setAttribute("download", fileName); //or any other extension
          document.body.appendChild(link);
          link.click();
        });
      }
    },

    goback() {
      this.$emit("go-back");
    },

    tokenIdKeyUp(e) {
      if (e.keyCode === 13) {
        this.openToken();
      }
    },

    openToken() {
      this.$refs.tokenForm.validate().then((validationResult: boolean) => {
        if (validationResult) {
          backend
            .getToken(this.tokenId)
            .then((token) => (this.token = token))
            .catch((err) => {
              const errMsg =
                err instanceof Error ? err.message : err.toString();
              if (errMsg.match(/404/)) {
                this.errorMsg =
                  "Es wurde kein Inhalt für dieses Token gefunden.";
              } else {
                this.errorMsg = errMsg;
              }

              this.errorDlg = true;

              setTimeout(() => {
                this.errorDlg = false;
                this.tokenId = "";
              }, 2000);
            });
        }
      });
    },
  },

  setup() {
    return {
      tokenId: "",
      token: null as Token,
      errorDlg: false,
      disableOpenTokenBtn: true,
      confirmCopyToClipboard: false,
      confirmCopyToClipboardText: "",
    };
  },

  watch: {
    tokenId() {
      this.disableOpenTokenBtn = this.tokenId.length === 0;
    },
  },

  mounted() {
    if (this.$refs.tokenId) {
      this.$refs.tokenId.focus();
    }
  },
});
</script>
