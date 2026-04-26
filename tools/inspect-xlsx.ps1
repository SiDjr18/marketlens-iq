param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [int]$MaxRows = 25
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipText($zip, [string]$name) {
  $entry = $zip.GetEntry($name)
  if ($null -eq $entry) { return $null }
  $stream = $entry.Open()
  try {
    $reader = [System.IO.StreamReader]::new($stream)
    try { return $reader.ReadToEnd() }
    finally { $reader.Dispose() }
  }
  finally { $stream.Dispose() }
}

function Col-Index([string]$ref) {
  $letters = ($ref -replace '[^A-Z]', '')
  $n = 0
  foreach ($ch in $letters.ToCharArray()) {
    $n = $n * 26 + ([int][char]$ch - [int][char]'A' + 1)
  }
  return [Math]::Max(0, $n - 1)
}

function Load-SharedStrings($zip, [int]$limit) {
  $entry = $zip.GetEntry('xl/sharedStrings.xml')
  $strings = New-Object System.Collections.Generic.List[string]
  if ($null -eq $entry) { return $strings }

  $stream = $entry.Open()
  try {
    $settings = [System.Xml.XmlReaderSettings]::new()
    $settings.IgnoreWhitespace = $false
    $reader = [System.Xml.XmlReader]::Create($stream, $settings)
    try {
      while ($reader.Read() -and $strings.Count -lt $limit) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element -and $reader.LocalName -eq 'si') {
          $text = $reader.ReadInnerXml()
          $text = $text -replace '<[^>]+>', ''
          $text = $text -replace '&amp;', '&'
          $text = $text -replace '&lt;', '<'
          $text = $text -replace '&gt;', '>'
          $strings.Add($text)
        }
      }
    }
    finally { $reader.Dispose() }
  }
  finally { $stream.Dispose() }
  return $strings
}

function Read-SheetRows($zip, [string]$sheetPath, $sharedStrings, [int]$maxRows) {
  $entry = $zip.GetEntry($sheetPath)
  $rows = @()
  if ($null -eq $entry) { return $rows }

  $stream = $entry.Open()
  try {
    $reader = [System.Xml.XmlReader]::Create($stream)
    try {
      while ($reader.Read() -and $rows.Count -lt $maxRows) {
        if ($reader.NodeType -eq [System.Xml.XmlNodeType]::Element -and $reader.LocalName -eq 'row') {
          $rowXml = [xml]("<row>" + $reader.ReadInnerXml() + "</row>")
          $cells = @{}
          foreach ($c in $rowXml.row.c) {
            $idx = Col-Index $c.r
            $type = [string]$c.t
            $value = [string]$c.v
            if ($type -eq 's') {
              $si = 0
              if ([int]::TryParse($value, [ref]$si) -and $si -lt $sharedStrings.Count) {
                $value = $sharedStrings[$si]
              }
            }
            elseif ($type -eq 'inlineStr') {
              $value = [string]$c.is.t
            }
            $cells[$idx] = $value
          }
          if ($cells.Count -gt 0) {
            $max = ($cells.Keys | Measure-Object -Maximum).Maximum
            $out = for ($i = 0; $i -le $max; $i++) { if ($cells.ContainsKey($i)) { $cells[$i] } else { '' } }
            $rows += ,$out
          }
        }
      }
    }
    finally { $reader.Dispose() }
  }
  finally { $stream.Dispose() }
  return $rows
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
  $workbookXml = [xml](Read-ZipText $zip 'xl/workbook.xml')
  $relsXml = [xml](Read-ZipText $zip 'xl/_rels/workbook.xml.rels')
  $shared = Load-SharedStrings $zip 200000
  $sheetInfos = @()

  foreach ($sheet in $workbookXml.workbook.sheets.sheet) {
    $rid = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $target = ($relsXml.Relationships.Relationship | Where-Object { $_.Id -eq $rid }).Target
    $sheetPath = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { 'xl/' + $target.TrimStart('/') }
    $rows = Read-SheetRows $zip $sheetPath $shared $MaxRows
    $sheetInfos += [pscustomobject]@{
      name = [string]$sheet.name
      id = [string]$sheet.sheetId
      path = $sheetPath
      sampledRows = $rows
    }
  }

  $result = [pscustomobject]@{
    file = $Path
    sizeBytes = (Get-Item -LiteralPath $Path).Length
    sharedStringsSampled = $shared.Count
    sheets = $sheetInfos
  }

  $result | ConvertTo-Json -Depth 8
}
finally {
  $zip.Dispose()
}
