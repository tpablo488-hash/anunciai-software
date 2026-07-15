export interface AdInput {
  product: string;
  category: string;
  marketplace: string;
  title: string;
  description: string;
  images: string[]; // data URLs
}

export const emptyAd: AdInput = {
  product: "",
  category: "",
  marketplace: "mercadolivre",
  title: "",
  description: "",
  images: [],
};
