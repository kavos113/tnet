package com.github.kavos113.tnet.feature.markdown.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MarkdownImageLinksTest {
  @Test
  fun resolvesObsidianImagesFromWorkspaceImageDirectory() {
    val markdown = "![[image.png]]"
    val resolved = resolveMarkdownImageLinks(
      markdown = markdown,
      currentDocumentPath = "docs/note.md",
      resolveImageDataUrl = { path ->
        if (path == "_images/image.png") "data:image/png;base64,aW1hZ2U=" else null
      }
    )

    assertEquals("![image.png](data:image/png;base64,aW1hZ2U=)", resolved)
  }

  @Test
  fun resolvesRelativeMarkdownImagesFromCurrentDocumentDirectory() {
    val markdown = "![diagram](images/diagram.webp)"
    val resolved = resolveMarkdownImageLinks(
      markdown = markdown,
      currentDocumentPath = "docs/spec/note.md",
      resolveImageDataUrl = { path ->
        if (path == "docs/spec/images/diagram.webp") "data:image/webp;base64,aW1hZ2U=" else null
      }
    )

    assertEquals("![diagram](data:image/webp;base64,aW1hZ2U=)", resolved)
  }

  @Test
  fun keepsExternalImagesUnchanged() {
    val markdown = "![remote](https://example.com/image.png)"
    val resolved = resolveMarkdownImageLinks(
      markdown = markdown,
      currentDocumentPath = "docs/note.md",
      resolveImageDataUrl = { error("external image should not be resolved") }
    )

    assertEquals(markdown, resolved)
  }

  @Test
  fun keepsParentTraversalOutsideWorkspaceUnchanged() {
    val markdown = "![bad](../../image.png)"
    val resolved = resolveMarkdownImageLinks(
      markdown = markdown,
      currentDocumentPath = "note.md",
      resolveImageDataUrl = { error("outside workspace path should not be resolved") }
    )

    assertEquals(markdown, resolved)
  }

  @Test
  fun renderMarkdownHtmlIncludesResolvedImageSrc() {
    val markdown = resolveMarkdownImageLinks(
      markdown = "![[image.png]]",
      currentDocumentPath = "docs/note.md",
      resolveImageDataUrl = { "data:image/png;base64,aW1hZ2U=" }
    )

    assertTrue(renderMarkdownHtml(markdown).contains("src=\"data:image/png;base64,aW1hZ2U=\""))
  }
}
