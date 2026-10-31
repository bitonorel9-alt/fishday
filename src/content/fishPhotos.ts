/** נוצר אוטומטית מ-Wikimedia Commons. כל תמונה ברישיון פתוח. */
export interface FishPhoto {
  file: string;
  width: number;
  height: number;
  author: string;
  license: string;
  source: string;
}

export const FISH_PHOTOS: Record<string, FishPhoto> = {
  sillago: { file: "fish/sillago.webp", width: 640, height: 427, author: "Ali Ibrahim", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Sillago_suezensis.jpg" },
  siganus: { file: "fish/siganus.webp", width: 640, height: 427, author: "Julien Renoult (jujurenoult)", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:20230518_Siganus_rivulatus.jpg" },
  sargus: { file: "fish/sargus.webp", width: 640, height: 387, author: "Diego Delso", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Sargo_com%C3%BAn_(Diplodus_sargus),_Madeira,_Portugal,_2019-05-31,_DD_29.jpg" },
  bori: { file: "fish/bori.webp", width: 640, height: 480, author: "Roberto Pillon", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Mugil_cephalus_Minorca.jpg" },
  mormyrus: { file: "fish/mormyrus.webp", width: 640, height: 427, author: "Marrabbio2", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Mormora.jpg" },
  denis: { file: "fish/denis.webp", width: 640, height: 480, author: "Roberto Pillon", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Sparus_aurata_Sardegna.jpg" },
  caranx: { file: "fish/caranx.webp", width: 640, height: 429, author: "SEFSC Pascagoula Laboratory; Collection of Brandi Noble, NOA", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Caranx_crysos.jpg" },
  palamida: { file: "fish/palamida.webp", width: 640, height: 480, author: "Rickard Zerpe", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Narrow-barred_spanish_mackerel_(Scomberomorus_commerson).jpg" },
  puffer: { file: "fish/puffer.webp", width: 640, height: 480, author: "Rickard Zerpe", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Silver_puffer_(Lagocephalus_sceleratus)_(48272090586).jpg" },
  lionfish: { file: "fish/lionfish.webp", width: 640, height: 853, author: "Alan Slater Photo2222", license: "CC BY-SA 3.0", source: "https://commons.wikimedia.org/wiki/File:Pterois_miles_red_sea.JPG" },
};
