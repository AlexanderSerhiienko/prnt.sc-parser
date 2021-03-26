<template>
  <div>
    <a :href="`https://prnt.sc/${picture.id}`" target="_blank"><img :src="picture.url" /></a> 
  </div>
</template>
<script>
export default {
  props: ["picture"],
};
</script>
<style scoped>
img {
  border: 1px solid black;
  max-width: 500px;
  height: auto;
  margin: 10px;
  border-radius: 10px;
}
</style>
