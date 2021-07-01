<template>
  <div class="chat-main">
    <ol class="chat-userList" :class="[state.showUserList ? '' : 'fold']">
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
      <button class="chat-textarea__toggleButton" @click="toggleUserList">
        {{ state.showUserList ? `&lt;` : `>` }}
      </button>
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
        <li v-if="state.disconnected.is" class="system-message">
          {{
            state.disconnected.reason === "transport close"
              ? "서버가 종료되었습니다."
              : "채팅방을 나갔습니다."
          }}
        </li>
      </ol>
      <transition name="fade">
        <button
          v-if="state.newMessage"
          @click="(state.newMessage = false), showNewMessage()"
          class="chat-textarea__newMessageButton"
        >
          새 메시지
        </button>
      </transition>
    </div>

    <form id="chat-form" @submit.prevent="chatSubmit">
      <input
        type="text"
        id="chat-form-input"
        autocomplete="off"
        placeholder="여기에 텍스트 입력"
        v-model="state.inputMessage"
        @keyup.enter="showNewMessage"
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
import { Transition } from "vue";

export default {
  name: "Chat",
  components: { Transition },
  setup() {
    const app = getCurrentInstance();
    const $socket = computed(
      () => app.appContext.config.globalProperties.$socket
    ).value;

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
      disconnected: {},
      newMessage: false,
      showUserList: true,
    });

    watch(
      () => state.messages.length,
      () => {
        if (isSeenNewMessage()) {
          chatTextarea.value.scrollTo({
            top: chatTextarea.value.scrollHeight,
          });
        }
      },
      { flush: "post" }
    );

    function chatSubmit() {
      if (state.inputMessage === "") return;

      $socket.emit("chat", {
        message: state.inputMessage,
        userId: $socket.id,
      });
      state.inputMessage = "";
    }

    function isSeenNewMessage() {
      function ifIsntPositiveReturnTrue(number) {
        if (number > 0) {
          return false;
        }
        return true;
      }
      return ifIsntPositiveReturnTrue(
        chatTextarea.value.scrollHeight -
          (chatTextarea.value.scrollTop + chatTextarea.value.offsetHeight + 105)
      );
    }

    function showNewMessage() {
      console.log("showNewMessage");
      chatTextarea.value.scrollTo({
        top: chatTextarea.value.scrollHeight,
      });
    }

    function toggleUserList() {
      state.showUserList = !state.showUserList;
    }

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");

      $socket.on("connect", () => {
        state.disconnected.is = false;
      });

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

        if (!isSeenNewMessage() && chattedUserId !== userId.value) {
          state.newMessage = true;
        }
      });
      $socket.on("disconnect", (reason) => {
        state.disconnected = {
          is: true,
          reason,
        };
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
      showNewMessage,
      toggleUserList,
    };
  },
};
</script>

<style lang="scss" scoped>
.chat-main {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto minmax(75px, 10vh);
  width: 100vw;
  height: 100vh;
  .chat-textarea {
    background: #fdfdfd;
    border-bottom: 1px solid #ccc;
    resize: none;
    box-sizing: border-box;
    overflow-y: auto;
    .chat-messageList {
      list-style: none;
      margin: 0;
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
    &__newMessageButton {
      position: absolute;
      bottom: 17vh;
      left: 50%;
      transform: translateX(-50%);
      font-size: 1.2rem;
      padding: 1em;
      background-color: hotpink;
      outline: none;
      border: none;
      color: #fdfdfd;
      border-radius: 10px;
      cursor: pointer;
      &:hover {
        background-color: #ff8ec7;
      }
      &:active {
        background-color: #ff2f97;
      }
    }
    &__toggleButton {
      position: absolute;
      top: 20px;
      left: 20px;
      cursor: pointer;
      background: none;
      border: none;
      outline: none;
      font-weight: bold;
      font-size: 2em;
      color: white;
      background-color: #dcdcdc;
      border-radius: 5px;
      width: 40px;
      height: 40px;
      opacity: 0.5;
      z-index: 1;
      &:hover {
        opacity: 1;
        background-color: hotpink;
      }
      &:active {
        background-color: #ff2f97;
      }
    }
  }
  .chat-userList {
    list-style: none;
    text-align: left;
    border-right: 1px solid #dcdcdc;
    padding: 0;
    margin: 0;
    grid-row: 1 / 3;
    box-sizing: border-box;
    overflow-y: auto;
    width: 275px;
    &__item {
      padding: 5px;
      padding-left: 40px;
    }
    .user-count {
      margin: 3em 0;
      font-size: 1.4em;
      text-align: center;
    }
    &.fold {
      width: 0;
      transform: translateX(-100%);
      & > li {
        display: none;
      }
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
  .fade-enter-active,
  .fade-leave-active {
    transition: all 0.35s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(50px);
  }
}
</style>
