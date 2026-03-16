import carnivoreIcon from "../../../assets/diets/carnivore.png";
import frugivoreIcon from "../../../assets/diets/frugivore.png";
import granivoreIcon from "../../../assets/diets/granivore.png";
import herbivoreIcon from "../../../assets/diets/herbivore.png";
import insectivoreIcon from "../../../assets/diets/Insectivore.png";
import invertivoreIcon from "../../../assets/diets/Invertivore.png";
import nectarivoreIcon from "../../../assets/diets/nectarivore.png";
import omnivoreIcon from "../../../assets/diets/omnivore.png";
import scavengerIcon from "../../../assets/diets/scavenger.png";
import florivoreIcon from "../../../assets/diets/florivore.png";

const dietIconMap: Array<{ keywords: string[]; icon: string }> = [
  { keywords: ["insectivore"], icon: insectivoreIcon },
  { keywords: ["invertivore"], icon: invertivoreIcon },
  { keywords: ["nectarivore"], icon: nectarivoreIcon },
  { keywords: ["frugivore"], icon: frugivoreIcon },
  { keywords: ["granivore"], icon: granivoreIcon },
  { keywords: ["florivore"], icon: florivoreIcon },
  { keywords: ["herbivore"], icon: herbivoreIcon },
  { keywords: ["carnivore"], icon: carnivoreIcon },
  { keywords: ["omnivore"], icon: omnivoreIcon },
  { keywords: ["scavenger"], icon: scavengerIcon },
];

export const getDietIcons = (diet?: string) => {
  const normalizedDiet = diet?.toLowerCase() || "";
  if (!normalizedDiet) {
    return [];
  }

  const icons = dietIconMap
    .filter((item) =>
      item.keywords.some((keyword) => normalizedDiet.includes(keyword)),
    )
    .map((item) => item.icon);

  return [...new Set(icons)];
};

export const getDietIcon = (diet?: string) => {
  return getDietIcons(diet)[0] ?? null;
};
