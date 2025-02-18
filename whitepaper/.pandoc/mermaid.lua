function CodeBlock(elem)
  if elem.classes[1] == "mermaid" then
    local fname = "./.pandoc/dist/" .. pandoc.sha1(elem.text) .. ".svg"
    pandoc.pipe("mmdc", {"-i", "-", "-o", fname}, elem.text)
    return pandoc.Para({pandoc.Image({pandoc.Str("Mermaid diagram")}, fname)})
  end
end
