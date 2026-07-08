def references_node_modules:
  any(
    .locations[]?.physicalLocation.artifactLocation.uri? // "";
    test("(^|[/\\\\])node_modules([/\\\\]|$)")
  );

.runs[]?.results |= map(select(references_node_modules | not))
