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
  max-width: 100%;
  height: auto;
  max-height: 400px;
}
div {
  
}
</style>
