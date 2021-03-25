<template>
  <Picture
    v-for="(picture, i) in pictures"
    :key="i"
    :picture="picture"
  />
</template>
<script>
import Picture from "@/components/Picture";
export default {
  components: {
    Picture,
  },
  props: ["pictures"],
};
</script>
<style scoped></style>
