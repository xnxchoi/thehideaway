import type { CollectionSlug, File, Payload } from "payload";

import { image1 } from "./images/img1";
import { image2 } from "./images/img2";
import { image3 } from "./images/img3";
import { image4 } from "./images/img4";
import { image5 } from "./images/img5";
import { image6 } from "./images/img6";
import { image7 } from "./images/img7";
import { post1 } from "./contents/post1";
import { post2 } from "./contents/post2";
import { post3 } from "./contents/post3";
import { post4 } from "./contents/post4";
import { post5 } from "./contents/post5";
import { post6 } from "./contents/post6";
import { post7 } from "./contents/post7";
import { Category, Media, Post } from "@/payload-types";
import { formatSlug } from "@/payload/fields/slug/formatSlug";

const collections: CollectionSlug[] = ["media", "posts", "categories", "users"];

export const seedRP = async ({
  payload
}: {
  payload: Payload;
}): Promise<void> => {
  payload.logger.info("Seeding database...");

  payload.logger.info(`— Clearing media...`);
  payload.logger.info(`— Clearing collections and globals...`);

  for (const collection of collections) {
    await payload.delete({
      collection,
      where: {
        id: {
          exists: true
        }
      }
    });
  }

  payload.logger.info(`— Seeding demo author and user...`);

  const demoAuthor = await payload.create({
    collection: "users",
    draft: false,
    data: {
      firstName: "Yong Jang",
      lastName: "Seo",
      email: "yongjangseo@gmail.com",
      emailVerified: false,
      bio: "Editor",
      role: "editor",
      slug: "yongjang-seo",
      verified: true,
      username: "yonjangseo",
      banned: false,
      name: "Yong Jang Seo",
      onboarded: false,
      twoFactorEnabled: false,
      displayUsername: "@yongjang"
    }
  });
  const demoAuthorID = demoAuthor.id;
  payload.logger.info(`— Seeding media...`);
  const [
    image1Buffer,
    image2Buffer,
    image3Buffer,
    image4Buffer,
    image5Buffer,
    image6Buffer,
    image7Buffer
  ] = await Promise.all([
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img1.jpg`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img2.jpg`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img3.png`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img4.png`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img5.jpg`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img6.jpg`),
    fetchFileByURL(`${process.env.NEXT_PUBLIC_SERVER_URL}/images/img7.jpg`)
  ]);

  payload.logger.info(`— Seeding image1...`);
  const images = [
    {
      data: image1,
      file: image1Buffer,
      alt: "Image 1"
    },
    {
      data: image2,
      file: image2Buffer,
      alt: "Image 2"
    },
    {
      data: image3,
      file: image3Buffer,
      alt: "Image 3"
    },
    {
      data: image4,
      file: image4Buffer,
      alt: "Image 4"
    },

    {
      data: image5,
      file: image5Buffer,
      alt: "Image 5"
    },
    {
      data: image6,
      file: image6Buffer,
      alt: "Image 6"
    },
    {
      data: image7,
      file: image7Buffer,
      alt: "Image 7"
    }
  ];
  const imageDocs: Media[] = [];
  for (const image of images) {
    const imageDoc = await payload.create({
      collection: "media",
      data: image.data,
      file: image.file
    });
    imageDocs.push(imageDoc);
  }
  const imageDocsIDs = imageDocs.map((imageDoc) => imageDoc.id);
  payload.logger.info(`— Seeding categories...`);

  const categories: Omit<Category, "id" | "updatedAt" | "createdAt">[] = [
    {
      title: "Uncategorized",
      slug: "uncategorized",
      relatedCategories: [],
      popularity: 10,
      identity: { accent: "none", layout: "left" }
    },
    {
      title: "Finance",
      slug: "finance",
      relatedCategories: [],
      popularity: 10,
      identity: { accent: "none", layout: "left" }
    },
    {
      title: "Art & Consumption",
      slug: "art-consumption",
      relatedCategories: [],
      popularity: 10,
      identity: { accent: "none", layout: "left" }
    },
    {
      title: "Homo Economicus",
      slug: "homo-economicus",
      relatedCategories: [],
      popularity: 10,
      identity: { accent: "none", layout: "left" }
    },
    {
      title: "Curation",
      slug: "curation",
      relatedCategories: [],
      popularity: 10,
      identity: { accent: "none", layout: "left" }
    }
  ];
  const categoryDocs: Category[] = [];
  for (const category of categories) {
    const categoryDoc = await payload.create({
      collection: "categories",
      data: category
    });
    categoryDocs.push(categoryDoc);
  }

  const categoryDocsIDs = categoryDocs.map((categoryDoc) => categoryDoc.id);

  for (const category of categoryDocs) {
    if (category.title === "Homo Economicus") {
      category.relatedCategories = categoryDocsIDs.filter(
        (id) => id !== category.id
      );
    }
    if (category.title !== "Uncategorized") {
      category.relatedCategories?.push(categoryDocsIDs[0]!);
    }
  }
  for (const category of categoryDocs) {
    const updatedCategory = await payload.update({
      id: category.id,
      collection: "categories",
      data: category
    });
    categoryDocs.splice(categoryDocs.indexOf(category), 1, updatedCategory);
  }

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const docsToCreate: Omit<Post, "createdAt" | "id" | "updatedAt">[] = [
    // {
    // 	title: post1.title!,
    // 	content: post1.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[0],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post1.title!),
    // 	subtitle: "",
    // },
    //
    // {
    // 	title: post2.title || "",
    // 	content: post2.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[1],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post2.title!),
    // 	subtitle: "",
    // },
    // {
    // 	title: post3.title!,
    // 	content: post3.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[2],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post3.title!),
    // 	subtitle: "",
    // },
    // {
    // 	title: post4.title!,
    // 	content: post4.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[3],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post4.title!),
    // 	subtitle: "",
    // },
    // {
    // 	title: post5.title!,
    // 	content: post5.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[4],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post5.title!),
    // 	subtitle: "",
    // },
    // {
    // 	title: post6.title!,
    // 	content: post6.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[5],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post6.title!),
    // 	subtitle: "",
    // },
    // {
    // 	title: post7.title!,
    // 	content: post7.content!,
    // 	category: categoryDocsIDs[0]!,
    // 	image: imageDocsIDs[6],
    // 	author: {relationTo: "users", value: demoAuthorID},
    // 	slug: formatSlug(post7.title!),
    // 	subtitle: "",
    // },
  ];
  const postDocs: Post[] = [];
  for (const post of docsToCreate) {
    const postDoc = await payload.create({
      collection: "posts",
      data: post
    });
    postDocs.push(postDoc);
  }
  const postDocsIDs = postDocs.map((postDoc) => postDoc.id);

  // update each post with related posts
  postDocsIDs[0] &&
    postDocsIDs[1] &&
    postDocsIDs[2] &&
    (payload.logger.info(`— Updating posts with related posts...`),
    await payload.update({
      id: postDocsIDs[0],
      collection: "posts",
      data: {
        relatedPosts: [postDocsIDs[1], postDocsIDs[2]]
      }
    }));

  postDocsIDs[0] &&
    postDocsIDs[1] &&
    postDocsIDs[2] &&
    (payload.logger.info(`— Updating post2 with related posts...`),
    await payload.update({
      id: postDocsIDs[1],
      collection: "posts",
      data: {
        relatedPosts: [postDocsIDs[0], postDocsIDs[2]]
      }
    }));
  //
  // payload.logger.info(`— Seeding pages...`)
  // const receptionPage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'Reception', slug: 'home', hero: {
  //       type: 'none',
  //     }, layout: [{
  //       blockType: 'heroSquare', populateBy: 'collection', relationTo: 'posts', categories: [],
  //     }],
  //   },
  // })
  //
  // payload.logger.info(`— Seeding register page...`)
  // const registerPage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'Register', slug: 'register', hero: {
  //       type: 'none',
  //     }, layout: [],
  //   },
  // })
  //
  // payload.logger.info(`— Seeding plans page...`)
  // const plansPage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'Plans', slug: 'plans', hero: {
  //       type: 'none',
  //     }, layout: [],
  //   },
  // })
  // payload.logger.info(`— Seeding lostinseoul page...`)
  // const lostinseoulPage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'LOSTINSEOUL', slug: 'lostinseoul', hero: {
  //       type: 'none',
  //     }, layout: [],
  //   },
  // })
  // payload.logger.info(`— Seeding the team page...`)
  // const theTeamPage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'The Team', slug: 'the-team', hero: {
  //       type: 'none',
  //     }, layout: [],
  //   },
  // })
  // const profilePage = await payload.create({
  //   collection: 'pages', data: {
  //     title: 'Your Account', slug: 'account', hero: {
  //       type: 'none',
  //     }, layout: [],
  //   },
  // })
  // payload.logger.info(`— Seeding header...`)
  //
  // await payload.updateGlobal({
  //   slug: 'header', data: {
  //     navItems: [{
  //       link: {
  //         type: 'reference', reference: { relationTo: 'pages', value: receptionPage.id }, label: 'Reception',
  //       },
  //     }, {
  //       link: {
  //         type: 'reference', reference: { relationTo: 'pages', value: plansPage.id }, label: 'Plans',
  //       },
  //     }, {
  //       link: {
  //         type: 'reference', reference: { relationTo: 'pages', value: lostinseoulPage.id }, label: 'LOSTINSEOUL',
  //       },
  //     }, {
  //       link: {
  //         type: 'reference', reference: { relationTo: 'pages', value: theTeamPage.id }, label: 'The Team',
  //       },
  //     }, {
  //       link: {
  //         type: 'reference', reference: { relationTo: 'pages', value: registerPage.id }, label: 'Register',
  //       },
  //     }],
  //   },
  // })
  //
  // payload.logger.info(`— Seeding footer...`)

  // await payload.updateGlobal({
  //   slug: 'footer', data: {
  //     navItems: [{
  //       link: {
  //         type: 'custom', label: 'Privacy Policy', url: '/privacy-policy',
  //       },
  //     },
  //
  //       {
  //         link: {
  //           type: 'custom', label: 'Terms of Service', newTab: true, url: '/terms-of-service',
  //         },
  //       }],
  //   },
  // })

  payload.logger.info("Seeded database successfully!");
};

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: "include",
    method: "GET"
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`);
  }

  const data = await res.arrayBuffer();

  return {
    name: url.split("/").pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split(".").pop()}`,
    size: data.byteLength
  };
}
