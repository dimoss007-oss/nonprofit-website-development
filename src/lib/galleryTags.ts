export const GALLERY_TAGS = [
  { id: "main", label: "Главная" },
  { id: "donate", label: "Пожертвования" },
  { id: "children", label: "Дети" },
  { id: "mothers", label: "Мамы" },
  { id: "events", label: "События" },
  { id: "center", label: "Центр" },
];

export const tagLabel = (id: string) => GALLERY_TAGS.find((t) => t.id === id)?.label || id;
