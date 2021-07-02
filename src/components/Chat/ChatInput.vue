<template>
  <form id="chat-form" @submit.prevent="chatSubmit">
    <input
      type="text"
      id="chat-form-input"
      autocomplete="off"
      placeholder="여기에 텍스트 입력"
      v-model="inputMessage"
      @keyup.enter="$emit('showNewMessage')"
    />
  </form>
</template>

<script>
import { ref } from "@vue/reactivity";
import { computed, getCurrentInstance } from "@vue/runtime-core";
export default {
  setup() {
    const app = getCurrentInstance();
    const $socket = computed(
      () => app.appContext.config.globalProperties.$socket
    ).value;

    let inputMessage = ref("");

    function chatSubmit() {
      if (inputMessage.value === "") return;

      $socket.emit("chat", {
        message: inputMessage.value,
        userId: $socket.id,
      });
      inputMessage.value = "";
    }

    return { inputMessage, chatSubmit };
  },
};
</script>

<style lang="scss" scoped>
#chat-form-input {
  width: 100%;
  height: 100%;
  margin: 0;
  box-sizing: border-box;
  border: none;
  outline: none;
  font-size: 18px;
  padding-left: 50px;
  &:focus {
    &::placeholder {
      color: transparent;
    }
  }
}
</style>
