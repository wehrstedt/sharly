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
            <span class="text-weight-bold q-ml-sm">{{ confirmCopyToClipboardText }}</span>
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

    <q-form
      class="row q-pt-xs full-width"
      ref="tokenForm"
      v-if="!fileToken && !textToken"
    >
      <q-input
        flat
        label="Token"
        ref="token"
        class="full-width"
        :rules="[(val) => !!val || 'Bitte gib einen Token ein.']"
        v-model="tokenId"
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

    <q-form class="row q-pt-xs full-width" v-if="fileToken">
      <q-tree
        :nodes="fileTokenNodes"
        node-key="path"
        default-expand-all
        selected-color="primary"
        :selected.sync="selectedFileToDownload"
      />
    </q-form>

    <q-form class="row q-pt-md full-width q-pt-md q-pb-md" v-if="textToken">
      <div class="column col-10">
        <span class="text-subtitle2" style="display: inline-block"
          >Geteilter Inhalt:</span
        >
      </div>

      <div class="column col-2">
        <q-btn
          flat
          icon="mdi-clipboard-multiple-outline"
          class="float-right"
          size="sm"
          @click="copySharedTextToClipboard"
        />
      </div>

      <div class="row full-width">
        {{ textToken.text }}
      </div>
    </q-form>

    <q-btn
      icon="mdi-close"
      color="primary"
      label="Schließen"
      class="full-width q-mt-xs"
      @click="
        textToken = fileToken = null;
        tokenId = '';
        goback();
      "
      v-if="textToken || fileToken"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import { api as backend, FileToken, TextToken } from "../boot/backend";
import { copyToClipboard } from "quasar";

export default defineComponent({
  name: "OpenContent",
  methods: {
    copySharedTextToClipboard() {
      copyToClipboard(this.textToken.text).then(() => {
        this.confirmCopyToClipboardText = "Text kopiert!";
        this.confirmCopyToClipboard = true;
        setTimeout(() => {
          this.confirmCopyToClipboard = false;
        }, 2000);
      });
    },

    downloadSelectedFile() {
      if (this.selectedFileToDownload) {
        backend.downloadFile(this.selectedFileToDownload).then((result) => {
          const url = window.URL.createObjectURL(new Blob([result as any]));
          const link = document.createElement("a");
          link.href = url;

          const fileName = this.fileTokenNodes[0].children.filter(
            (f) => f.path === this.selectedFileToDownload
          )[0].label;
          link.setAttribute("download", fileName); //or any other extension
          document.body.appendChild(link);
          link.click();
        });
      }
    },

    goback() {
      this.$emit("go-back");
    },

    openToken() {
      this.$refs.tokenForm.validate().then((validationResult: boolean) => {
        if (validationResult) {
          backend
            .getToken(this.tokenId)
            .then((token) => {
              if (typeof (token as any).files !== "undefined") {
                this.fileToken = token;
              } else {
                this.textToken = token;
              }
            })
            .catch((err) => {
              const errMsg =
                err instanceof Error ? err.message : err.toString();
              console.log(err);
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
      fileToken: null as FileToken,
      textToken: null as TextToken,
      errorDlg: false,
      disableOpenTokenBtn: true,
      fileTokenNodes: [],
      selectedFileToDownload: null,
      confirmCopyToClipboard: false,
      confirmCopyToClipboardText: ""
    };
  },

  watch: {
    tokenId() {
      this.disableOpenTokenBtn = this.tokenId.length === 0;
    },

    fileToken() {
      if (this.fileToken) {
        this.fileTokenNodes = [
          {
            label: "Dateien",
            icon: "mdi-file",
            path: "",
            children: this.fileToken.files.map((file) => {
              console.log(file);
              return {
                label: file.name,
                icon: "mdi-file",
                path: file.path,
                children: [],
              };
            }),
          },
        ];
      } else {
        this.fileTokenNodes = [];
      }
    },

    selectedFileToDownload() {
      if (this.selectedFileToDownload) {
        this.downloadSelectedFile();
      }
    },
  },

  mounted() {
    if (this.$refs.token) {
      this.$refs.token.focus();
    }
  },
});
</script>
