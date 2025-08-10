"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mentions_1 = require("./Comments/mentions");
var processMentions_1 = require("./Comments/hooks/processMentions");
var utils_1 = require("../plugins/locker/fields/authority/utils");
// Access control functions
var isAdminOrAuthor = function (_a) {
    var user = _a.req.user;
    if (!user)
        return false;
    if ((user === null || user === void 0 ? void 0 : user.role) === "admin")
        return true;
    if ((user === null || user === void 0 ? void 0 : user.role) === "editor")
        return true;
    return {
        author: {
            equals: user.id,
        },
    };
};
// Check if comments are enabled for the referenced document
var areCommentsEnabled = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var payload, collectionValue, documentId, comment, error_1, document_1, isAuthor, error_2;
    var _c;
    var req = _b.req, data = _b.data, id = _b.id;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                payload = req.payload;
                collectionValue = null;
                documentId = data === null || data === void 0 ? void 0 : data.documentId;
                // Extract collection information
                if (data === null || data === void 0 ? void 0 : data.collection) {
                    if (typeof data.collection === "object" &&
                        data.collection.relationTo &&
                        data.collection.value) {
                        // It's a relationship object
                        collectionValue = data.collection.relationTo;
                        // documentId is already set above
                    }
                    else {
                        // It's a string (legacy format or just the collection name)
                        collectionValue = data.collection;
                    }
                }
                if (!((!collectionValue || !documentId) && id)) return [3 /*break*/, 4];
                _d.label = 1;
            case 1:
                _d.trys.push([1, 3, , 4]);
                return [4 /*yield*/, payload.findByID({
                        collection: "comments",
                        id: id,
                    })];
            case 2:
                comment = _d.sent();
                if (typeof comment.collection === "object" &&
                    comment.collection.relationTo) {
                    collectionValue = comment.collection.relationTo;
                }
                else {
                    collectionValue = comment.collection;
                }
                documentId = comment.documentId;
                return [3 /*break*/, 4];
            case 3:
                error_1 = _d.sent();
                console.error("Error fetching comment ".concat(id, ":"), error_1);
                return [2 /*return*/, false];
            case 4:
                if (!(collectionValue && documentId)) return [3 /*break*/, 8];
                _d.label = 5;
            case 5:
                _d.trys.push([5, 7, , 8]);
                return [4 /*yield*/, payload.findByID({
                        collection: collectionValue,
                        id: documentId,
                    })];
            case 6:
                document_1 = _d.sent();
                // If commentsEnabled is explicitly false, block access
                if (document_1.commentsEnabled === false) {
                    // Allow admins and editors to still see the comments even if disabled
                    if (req.user &&
                        req.user.role &&
                        ["editor", "admin"].includes(req.user.role)) {
                        return [2 /*return*/, true];
                    }
                    // Check if user is an author of the post
                    if (req.user &&
                        req.user.role &&
                        (0, utils_1.roleToAuthority)(req.user.role) >= (0, utils_1.roleToAuthority)("author") &&
                        Array.isArray(document_1.authors)) {
                        isAuthor = (_c = document_1.authors) === null || _c === void 0 ? void 0 : _c.some(function (authorId) {
                            if (typeof authorId === "object" && authorId.id) {
                                return authorId.id === req.user.id;
                            }
                            return authorId === req.user.id;
                        });
                        if (isAuthor) {
                            return [2 /*return*/, true];
                        }
                    }
                    // Not admin, editor, or author - deny access
                    return [2 /*return*/, false];
                }
                // Comments are enabled, grant access
                return [2 /*return*/, true];
            case 7:
                error_2 = _d.sent();
                console.error("Error checking commentsEnabled for ".concat(collectionValue, "/").concat(documentId, ":"), error_2);
                // If we can't determine, default to allowing access
                return [2 /*return*/, true];
            case 8: 
            // If we can't determine, default to allowing access
            return [2 /*return*/, true];
        }
    });
}); };
// Field-level access for sticky functionality
// Only allow collection admins or content author to make sticky
var canMakeSticky = function (_a) {
    var user = _a.req.user, data = _a.data;
    if (!user)
        return false;
    if ((user === null || user === void 0 ? void 0 : user.role) === "admin")
        return true;
    if ((user === null || user === void 0 ? void 0 : user.role) === "editor")
        return true;
    if ((data === null || data === void 0 ? void 0 : data.author) && (data === null || data === void 0 ? void 0 : data.author.id) === user.id)
        return true;
    // Check if the user is the author of the content being commented on
    // This requires additional logic in an actual hook
    return false;
};
// Comments Collection Config
var Comments = {
    slug: "comments",
    admin: {
        useAsTitle: "content",
        defaultColumns: [
            "content",
            "author",
            "collection",
            "createdAt",
            "isSticky",
        ],
    },
    access: {
        read: areCommentsEnabled,
        create: function (args) {
            var user = args.req.user;
            if (!user)
                return false;
            // Check if comments are enabled before allowing creation
            return areCommentsEnabled(args);
        },
        update: function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var canEdit;
            return __generator(this, function (_a) {
                canEdit = isAdminOrAuthor(args);
                if (!canEdit)
                    return [2 /*return*/, false];
                return [2 /*return*/, areCommentsEnabled(args)];
            });
        }); },
        delete: function (args) { return __awaiter(void 0, void 0, void 0, function () {
            var canDelete;
            return __generator(this, function (_a) {
                canDelete = isAdminOrAuthor(args);
                if (!canDelete)
                    return [2 /*return*/, false];
                return [2 /*return*/, areCommentsEnabled(args)];
            });
        }); },
    },
    hooks: {
        beforeChange: [
            // Process mentions from content
            processMentions_1.processMentions, // Set isEdited flag when content is updated after creation
            function (_a) {
                var data = _a.data, originalDoc = _a.originalDoc;
                if (originalDoc && data.content !== originalDoc.content) {
                    data.isEdited = true;
                }
                return data;
            },
        ],
    },
    fields: [
        {
            name: "content",
            type: "richText",
            required: true,
            admin: {},
        },
        {
            name: "author",
            type: "relationship",
            relationTo: "users",
            hasMany: false,
            maxDepth: 1,
            required: true,
            admin: {
                position: "sidebar",
            },
        },
        {
            name: "document",
            label: "Document",
            type: "relationship",
            relationTo: ["posts", "surf"], // Add more collections as needed
            required: true,
            admin: {
                position: "sidebar",
                description: "Which document this comment belongs to",
            },
            hasMany: false,
            maxDepth: 1,
        },
        {
            name: "isEdited",
            label: "Edited",
            type: "checkbox",
            admin: {
                position: "sidebar",
                readOnly: true,
            },
            defaultValue: false,
        },
        {
            name: "isReply",
            label: "Is Reply",
            type: "checkbox",
            admin: {
                position: "sidebar",
            },
            defaultValue: false, // },
            // {
            //   name: 'parentComment', label: 'Parent Comment', type: 'relationship', relationTo: 'comments', admin: {
            //     condition: (data) => data.isReply, position: 'sidebar', description: 'Select which comment this is a reply to',
            //   }, // Filter to only show comments from the same document
            //   filterOptions: ({ data }) => {
            //     if (!data?.collection || !data?.documentId) return {} // No filter if no collection/document
            //
            //     // Handle relationship format with relationTo and value properties
            //     const collectionValue = typeof data.collection === 'object' && data.collection.relationTo ? data.collection.relationTo : data.collection
            //
            //     return {
            //       and: [{
            //         collection: {
            //           relationTo: collectionValue,
            //         },
            //       }, {
            //         documentId: {
            //           equals: data.documentId,
            //         },
            //       }, {
            //         isReply: {
            //           equals: false, // Only top-level comments can be parents
            //         },
            //       }],
            //     }
            //   },
        },
        {
            name: "mentions",
            label: "Mentions",
            type: "array",
            admin: {
                initCollapsed: true,
            },
            fields: [
                // Using custom mention field
                (0, mentions_1.mention)({
                    relationTo: "users",
                    label: "User",
                }),
            ],
        },
        {
            name: "isSticky",
            label: "Sticky Comment",
            type: "checkbox",
            defaultValue: false,
            access: {
                update: canMakeSticky,
            },
            admin: {
                position: "sidebar",
                description: "Pin this comment to the top",
            },
        },
        {
            name: "likes",
            label: "Likes",
            type: "relationship",
            relationTo: "users",
            hasMany: true,
            admin: {
                description: "Users who liked this comment",
                readOnly: true, // Users will like via API, not admin panel
            },
        },
    ],
    timestamps: true,
};
exports.default = Comments;
