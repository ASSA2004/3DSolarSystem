const pictures = import.meta.glob("../../images/webp/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const textures = import.meta.glob("../../textures/*/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
export const illustration = (id) =>
  pictures[
    "../../images/webp/" + (id[0].toUpperCase() + id.slice(1)) + ".webp"
  ];
export const textureURL = (file, lite = false) =>
  textures[
    "../../textures/" +
      (lite ? "lite" : "standard") +
      "/" +
      file.replace(/\.(jpg|png)$/, ".webp")
  ];
