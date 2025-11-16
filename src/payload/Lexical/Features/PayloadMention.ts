// PayloadMentionPlugin.js - Main export for Payload integration
import {
  MentionNode,
  $createMentionNode,
  $isMentionNode
} from "./Mentions/nodes/MentionNode";
import { MentionPlugin } from "./Mentions/MentionPlugin";

export const PayloadMentionPlugin = {
  nodes: [MentionNode],
  Plugin: MentionPlugin
};

// Add the beforeChange hook to extract and save mentions
export const beforeChangeHook = ({ data, req, operation, originalDoc }) => {
  // This function should be registered in the collection config
  if (!data.content) return data;

  try {
    // Extract mentions from content
    const mentions = extractMentionsFromContent(data.content);

    // Add to data for saving
    data.mentioned = mentions;

    // For updates, create notifications for new mentions
    if (operation === "update" && originalDoc) {
      const originalMentions = originalDoc.mentioned || [];
      const originalIds = originalMentions.map((mention) => mention.id);

      // Filter to only new mentions
      const newMentions = mentions.filter(
        (mention) => !originalIds.includes(mention.id)
      );

      // Create notifications for new mentions
      if (newMentions.length > 0) {
        createMentionNotifications(newMentions, {
          contentId: originalDoc.id,
          contentType: req.collection.slug,
          createdBy: req.user?.id
        });
      }
    } else if (operation === "create") {
      // For new content, create notifications for all mentions
      if (mentions.length > 0) {
        // We'll need the ID after creation, so this will need to be handled
        // in an afterChange hook for creates
      }
    }
  } catch (error) {
    console.error("Error processing mentions:", error);
  }

  return data;
};

// Helper to extract mentions from Lexical content
function extractMentionsFromContent(content) {
  try {
    if (typeof content !== "string") return [];

    const parsedContent = JSON.parse(content);
    const mentions = [];

    // Recursively search for mention nodes
    function findMentionsInNode(node) {
      if (node.type === "mention" && node.mention) {
        mentions.push({
          id: node.mention.id,
          slug: node.mention.slug
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(findMentionsInNode);
      }
    }

    if (parsedContent.root && parsedContent.root.children) {
      parsedContent.root.children.forEach(findMentionsInNode);
    }

    // Remove duplicates
    const uniqueMentions = [];
    const mentionIds = new Set();

    mentions.forEach((mention) => {
      if (!mentionIds.has(mention.id)) {
        mentionIds.add(mention.id);
        uniqueMentions.push(mention);
      }
    });

    return uniqueMentions;
  } catch (error) {
    console.error("Error extracting mentions:", error);
    return [];
  }
}

// Helper to create notifications
async function createMentionNotifications(mentions, context) {
  try {
    const { contentId, contentType, createdBy } = context;

    for (const mention of mentions) {
      await payload.create({
        collection: "notifications",
        data: {
          type: "mention",
          recipient: mention.id,
          sender: createdBy,
          relatedContent: {
            id: contentId,
            collection: contentType
          },
          read: false
        }
      });
    }
  } catch (error) {
    console.error("Error creating mention notifications:", error);
  }
}

// Usage in your Payload config:
/*
export const collectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'content',
      type: 'richText',
      editor: {
        // Register the plugin with your Lexical editor
        plugins: [PayloadMentionPlugin],
      },
    },
    {
      name: 'mentioned',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [beforeChangeHook],
    afterChange: [
      // For create operations, we need to add notifications after we have the contentId
      async ({ req, operation, doc }) => {
        if (operation === 'create' && doc.mentioned && doc.mentioned.length > 0) {
          await createMentionNotifications(doc.mentioned, {
            contentId: doc.id,
            contentType: req.collection.slug,
            createdBy: req.user?.id,
          });
        }
      },
    ],
  },
};
*/
