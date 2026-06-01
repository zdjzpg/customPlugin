Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName PresentationFramework
$videos = @(
  'C:\Users\19816\Desktop\微信视频_20260408202324.mp4',
  'C:\Users\19816\Desktop\微信视频_20260408202331.mp4',
  'C:\Users\19816\Desktop\微信视频2026-04-08_202317_746.mp4'
)
$outDir = 'C:\Users\19816\Desktop\新建文件夹 (2)\video_frames'
foreach($video in $videos){
  $player = New-Object System.Windows.Media.MediaPlayer
  $opened = $false
  $failed = $false
  $player.add_MediaOpened({ $script:opened = $true })
  $player.add_MediaFailed({ param($s,$e) Write-Host "FAILED $video $($e.ErrorException.Message)"; $script:failed = $true })
  $script:opened = $false
  $script:failed = $false
  $player.Open((New-Object System.Uri($video)))
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while(-not $script:opened -and -not $script:failed -and $sw.Elapsed.TotalSeconds -lt 10){ Start-Sleep -Milliseconds 200 }
  if(-not $script:opened){ Write-Host "OPEN_TIMEOUT $video"; continue }
  Start-Sleep -Milliseconds 500
  $player.Position = [TimeSpan]::FromSeconds([Math]::Min(1, [Math]::Max(0, $player.NaturalDuration.TimeSpan.TotalSeconds / 4)))
  Start-Sleep -Milliseconds 800
  $width = if($player.NaturalVideoWidth -gt 0){ $player.NaturalVideoWidth } else { 720 }
  $height = if($player.NaturalVideoHeight -gt 0){ $player.NaturalVideoHeight } else { 1280 }
  $dv = New-Object System.Windows.Media.DrawingVisual
  $dc = $dv.RenderOpen()
  $brush = New-Object System.Windows.Media.VideoDrawing
  $brush.Rect = New-Object System.Windows.Rect(0,0,$width,$height)
  $brush.Player = $player
  $dc.DrawDrawing($brush)
  $dc.Close()
  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap($width,$height,96,96,[System.Windows.Media.PixelFormats]::Pbgra32)
  $rtb.Render($dv)
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))
  $name = [IO.Path]::GetFileNameWithoutExtension($video) + '.png'
  $path = Join-Path $outDir $name
  $fs = [IO.File]::Open($path,[IO.FileMode]::Create)
  $encoder.Save($fs)
  $fs.Close()
  Write-Host "SAVED $path $width x $height"
  $player.Close()
}
