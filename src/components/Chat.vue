<template>
  <div class="chat-main">
    <ol class="chat-userList">
      <li class="user-count">{{ state.userCount }}명 접속중</li>
      <li
        v-for="user in state.userList"
        :key="user.id"
        class="chat-userList__item"
      >
        {{ user.username }}(Guest{{ user.order }})
      </li>
    </ol>
    <div class="chat-textarea" ref="chatTextarea">
      <ol class="chat-messageList" ref="chatMessageList">
        <li
          v-for="(message, index) in state.messages"
          :key="index"
          :class="[
            message.type === 'chat' ? 'chat-message' : 'system-message',
            message.userId === userId ? 'my-chat-message' : '',
          ]"
        >
          <p
            v-if="message.type === 'chat' && message.username !== username"
            class="chat-message__username"
          >
            {{ `${message.username}(Guest${message.order})` }}
          </p>
          {{
            message.type === "chat"
              ? `${message.messageText}`
              : message.type === "welcome"
              ? `${message.username}(Guest${message.order})님이 입장하셨습니다.`
              : `${message.username}(Guest${message.order})님이 퇴장하셨습니다.`
          }}
        </li>
        <li v-if="state.isDisconnected" class="system-message">
          서버가 닫혔습니다.
        </li>
      </ol>
    </div>

    <form id="chat-form" @submit.prevent="chatSubmit">
      <input
        type="text"
        id="chat-form-input"
        autocomplete="off"
        placeholder="여기에 텍스트 입력"
        v-model="state.inputMessage"
      />
    </form>
  </div>
</template>

<script>
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "@vue/runtime-core";
import { useRoute } from "vue-router";

export default {
  name: "Chat",
  setup() {
    const app = getCurrentInstance();
    const $socket = app.appContext.config.globalProperties.$socket;

    const route = useRoute();
    const username = computed(() => route.params.username);
    const userId = computed(() => $socket.id);

    const chatTextarea = ref(null);
    const chatMessageList = ref(null);

    const state = reactive({
      inputMessage: "",
      messages: [],
      userCount: 0,
      userList: [],
      isDisconnected: $socket.disconnected,
    });

    watch(
      () => state.messages.length,
      () => {
        chatTextarea.value.scrollTo({
          top: chatTextarea.value.scrollHeight,
        });
      }
    );

    function chatSubmit() {
      if (state.inputMessage === "") return;

      $socket.emit("chat", {
        message: state.inputMessage,
        userId: $socket.id,
      });
      state.inputMessage = "";
    }

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");

      $socket.on("joinUser", ({ username, order }) => {
        state.messages.push({ username, order, type: "welcome" });
      });
      $socket.on("exitUser", ({ username, order }) => {
        state.messages.push({ username, order, type: "goodbye" });
      });
      $socket.on("userListUpdate", (userList) => {
        state.userList = userList.slice();
      });
      $socket.on("count", (count) => {
        state.userCount = count;
      });
      $socket.on("chat", ({ username, message, order, chattedUserId }) => {
        state.messages.push({
          username,
          messageText: message,
          order,
          userId: chattedUserId,
          type: "chat",
        });
      });
      $socket.on("disconnect", () => {
        alert("서버가 닫혔습니다.");
        state.isDisconnected = true;
      });
    });

    onUnmounted(() => {
      $socket.disconnect();
    });

    return {
      state,
      chatSubmit,
      username,
      chatMessageList,
      chatTextarea,
      userId,
    };
  },
};
</script>

<style lang="scss" scoped>
.chat-main {
  display: grid;
  grid-template-columns: 4fr 1fr;
  grid-template-rows: 90vh 10vh;
  width: 100vw;
  height: 100vh;
  .chat-textarea {
    background: #fdfdfd;
    border: 1px solid #ccc;
    border-left: none;
    max-width: 80vw;
    min-width: 80vw;
    height: 90vh;
    resize: none;
    box-sizing: border-box;
    overflow-y: auto;
    .chat-messageList {
      list-style: none;
      margin: 0;
      margin-bottom: 10vh;
      padding: 4.6em 50px 2em;
      box-sizing: border-box;
      &:after {
        content: "";
        display: block;
        clear: both;
      }
      & > li {
        margin-bottom: 2.6em;
        clear: both;
      }
      .system-message {
        text-align: center;
        font-weight: bold;
      }
      .chat-message {
        float: left;
        border-radius: 5px;
        padding: 20px;
        background-color: #dcdcdc;
        position: relative;
        &.my-chat-message {
          float: right;
          background-color: #fdfdfd;
          border: 1px solid hotpink;
        }
        &__username {
          width: 200px;
          position: absolute;
          top: -3em;
          left: 0;
          font-size: 0.9em;
          font-weight: bold;
        }
      }
    }
  }
  .chat-userList {
    list-style: none;
    text-align: left;
    border: 1px solid #dcdcdc;
    border-bottom: none;
    padding: 0;
    margin: 0;
    grid-row: 1 / 3;
    box-sizing: border-box;
    overflow-y: auto;
    &__item {
      padding: 5px;
      padding-left: 40px;
    }
    .user-count {
      margin: 3em 0;
      font-size: 1.4em;
      text-align: center;
    }
  }
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
}
</style>
