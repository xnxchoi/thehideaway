// MentionNode.js
import type { UserOverview } from "@/types/collections/posts";
import {
  $applyNodeReplacement,
  ElementNode,
  LexicalNode,
  EditorConfig
} from "lexical";
import { useState } from "react";

export class MentionNode extends ElementNode {
  __mention;
  __text;

  static override getType() {
    return "mention";
  }

  static override clone(node: MentionNode) {
    return new MentionNode(node.__mention, node.__text, node.__key);
  }

  constructor(mentionData: any, text: string, key: string) {
    super(key);
    this.__mention = mentionData;
    this.__text = text;
  }

  override createDOM(config: EditorConfig) {
    const dom = document.createElement("span");
    dom.classList.add("mention");
    dom.setAttribute("data-mention-id", this.__mention.id);
    dom.setAttribute("data-mention-slug", this.__mention.slug);
    dom.setAttribute("contenteditable", "false");
    dom.textContent = `@${this.__text}`;
    return dom;
  }

  override updateDOM() {
    // Return false to indicate DOM doesn't need to be recreated
    // we'll handle updates in decorate()
    return false;
  }

  override exportJSON() {
    return {
      ...super.exportJSON(),
      mention: this.__mention,
      text: this.__text
    };
  }

  getMention() {
    return this.__mention;
  }

  setMention(mention: any) {
    const self = this.getWritable();
    self.__mention = mention;
  }

  getText() {
    return this.__text;
  }

  setText(text: string) {
    const self = this.getWritable();
    self.__text = text;
  }

  // This prevents the node from being selectable partially
  override isInline() {
    return true;
  }

  // This will register this node as an element and not part of selection
  isIsolated() {
    return true;
  }

  // This will render the node as an inline-block
  isInlineable() {
    return true;
  }

  decorate() {
    return (
      <span
        className={`mention-component`}
        onClick={(e) => {
          // Prevent editor focus loss when clicking
          e.preventDefault();

          // Navigate to user profile
          window.location.href = `/@${this.__mention.slug}`;
        }}
      >
        <span className="mention-prefix">@</span>
        <span className="mention-name">{this.__text}</span>
        {isHovered && (
          <div className="mention-tooltip">
            <div className="mention-tooltip-avatar">
              {this.__mention.image ? (
                <img src={this.__mention.image.url} alt={this.__mention.slug} />
              ) : (
                <span>{this.__mention.slug.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="mention-tooltip-info">
              <div className="mention-tooltip-name">{this.__mention.slug}</div>
              {this.__mention.title && (
                <div className="mention-tooltip-title">
                  {this.__mention.title}
                </div>
              )}
            </div>
          </div>
        )}
      </span>
    );
  }

  static override importJSON(serializedNode: any) {
    const node = $createMentionNode(
      serializedNode.mention,
      serializedNode.text,
      serializedNode.key
    );
    return node;
  }
}

export function $createMentionNode(
  mentionData: UserOverview,
  mentionText: string,
  key: string
) {
  return $applyNodeReplacement(new MentionNode(mentionData, mentionText, key));
}

export function $isMentionNode(node: ElementNode) {
  return node instanceof MentionNode;
}
