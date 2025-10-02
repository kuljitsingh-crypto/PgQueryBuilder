export const relType = {
  one: 1,
  many: 2,
} as const;

export const relationShip = {
  oneToOne: { self: relType.one, other: relType.one, mirror: "oneToOne" },
  oneToMany: { self: relType.one, other: relType.many, mirror: "manyToOne" },
  manyToOne: { self: relType.many, other: relType.one, mirror: "oneToMany" },
  manyToMany: { self: relType.many, other: relType.many, mirror: "manyToMany" },
} as const;
