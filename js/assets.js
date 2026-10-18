const files = import.meta.glob("../{images,textures}/*.{png,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
});
export const illustration = (id) =>
  files[
    `../images/${id === "sun" ? "Sun" : id[0].toUpperCase() + id.slice(1)}.png`
  ];
export const textureURL = (file) => files[`../textures/${file}`];
