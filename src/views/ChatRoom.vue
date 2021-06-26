<template>
  <chat />
</template>

<script>
import { computed } from "@vue/runtime-core";
import { useRoute } from "vue-router";
import Chat from "../components/Chat.vue";

export default {
  name: "ChatRoom",
  components: { Chat },
  setup() {
    const route = useRoute();
    const username = computed(() => route.params.username);

    return {
      username,
    };
  },
};
</script>
