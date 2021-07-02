<template>
  <div class="chat-main">
    <UserList :userList="state.userList" :userCount="state.userCount" />
    <ChatArea :username="username" :disconnected="state.disconnected" />
  </div>
</template>

<script>
import {
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  reactive,
} from "@vue/runtime-core";
import { useRoute } from "vue-router";
import UserList from "./UserList.vue";
import ChatArea from "./ChatArea.vue";

export default {
  name: "Chat",
  components: { UserList, ChatArea },
  setup() {
    const app = getCurrentInstance();
    const $socket = computed(
      () => app.appContext.config.globalProperties.$socket
    ).value;

    const route = useRoute();
    const username = computed(() => route.params.username);

    const state = reactive({
      inputMessage: "",
      userList: [],
      userCount: 0,
      disconnected: {
        is: true,
        reason: "",
      },
    });

    onMounted(() => {
      $socket.emit("joinUser", username.value);
      $socket.emit("getCount");

      $socket.on("connect", () => {
        state.disconnected = {
          ...state.disconnected,
          is: false,
        };
      });
      $socket.on("userListUpdate", (userList) => {
        state.userList = userList.slice();
      });
      $socket.on("count", (count) => {
        state.userCount = count;
      });
      $socket.on("disconnect", (reason) => {
        console.log("disconnect");
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
      username,
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
}
</style>
