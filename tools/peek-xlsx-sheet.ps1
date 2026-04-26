param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [string]$Entry = "xl/worksheets/sheet1.xml",
  [int]$Chars = 5000
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
try {
  $entryObj = $zip.GetEntry($Entry)
  if ($null -eq $entryObj) {
    throw "Entry not found: $Entry"
  }
  $stream = $entryObj.Open()
  try {
    $reader = [System.IO.StreamReader]::new($stream)
    try {
      $buffer = New-Object char[] $Chars
      $read = $reader.Read($buffer, 0, $Chars)
      -join $buffer[0..($read - 1)]
    }
    finally { $reader.Dispose() }
  }
  finally { $stream.Dispose() }
}
finally {
  $zip.Dispose()
}
