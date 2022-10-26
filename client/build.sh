#!/bin/bash

# STIG Manager client distribution build script
#
# Requires nodejs and npm to install uglify-js
# npm install -g uglify-js
#
# Build artifacts will created in ./dist

echo "Client build starting"

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

SrcDir=src
DistDir=dist

# Clean dist directory
echo "Cleaning $DistDir"
rm -rf $DistDir/*

# ExtJS
echo "Preparing ExtJS resources"
ExtResources="ext/adapter/ext/ext-base.js
ext/ext-all.js
ext/ux/GroupSummary.js
ext/resources/css/ext-all.css
ext/resources/css/xtheme-gray.css
ext/resources/images/default/shadow-c.png
ext/resources/images/default/shadow-lr.png
ext/resources/images/default/shadow.png
ext/resources/images/default/button/arrow.gif
ext/resources/images/default/dd/drop-no.gif
ext/resources/images/default/grid/loading.gif
ext/resources/images/default/grid/hmenu-asc.gif
ext/resources/images/default/grid/hmenu-desc.gif
ext/resources/images/default/grid/columns.gif
ext/resources/images/default/grid/grid-split.gif
ext/resources/images/default/grid/grid3-special-col-bg.gif
ext/resources/images/default/menu/menu.gif
ext/resources/images/default/tree/loading.gif
ext/resources/images/gray/button/btn.gif
ext/resources/images/gray/button/group-cs.gif
ext/resources/images/gray/button/group-tb.gif
ext/resources/images/gray/button/group-lr.gif
ext/resources/images/gray/form/trigger.gif
ext/resources/images/gray/form/clear-trigger.gif
ext/resources/images/gray/grid/col-move-bottom.gif
ext/resources/images/gray/grid/col-move-top.gif
ext/resources/images/gray/grid/grid3-special-col-sel-bg.gif
ext/resources/images/gray/grid/sort_asc.gif
ext/resources/images/gray/grid/sort_desc.gif
ext/resources/images/gray/menu/group-checked.gif
ext/resources/images/gray/menu/item-over.gif
ext/resources/images/gray/menu/item-over-disabled.gif
ext/resources/images/gray/menu/menu-parent.gif
ext/resources/images/gray/panel/tool-sprites.gif
ext/resources/images/gray/panel/white-top-bottom.gif
ext/resources/images/gray/qtip/tip-anchor-sprite.gif
ext/resources/images/gray/qtip/tip-sprite.gif
ext/resources/images/gray/tabs/tab-close.gif
ext/resources/images/gray/tabs/scroll-left.gif
ext/resources/images/gray/tabs/scroll-right.gif
ext/resources/images/gray/window/icon-question.gif
ext/ux/fileuploadfield/css/fileuploadfield.css"
tar cf - -C $SrcDir --files-from <(echo "${ExtResources}") | tar xf - -C $DistDir

# CSS
echo "Preparing CSS resources"
cp -r $SrcDir/css $DistDir

# Fonts
echo "Preparing font resources"
cp -r $SrcDir/fonts $DistDir

# Images
echo "Preparing image resources"
cp -r $SrcDir/img $DistDir

# HTML
echo "Preparing HTML resources"
cp -r $SrcDir/index.html $DistDir/index.html

# Service Worker
echo "Preparing Service Worker resources"
cp -r $SrcDir/serviceWorker.js $DistDir/serviceWorker.js

# JS
echo "Preparing JavaScript resources"
mkdir $DistDir/js
cp $SrcDir/js/init-dist.js $DistDir/js/init.js
cp $SrcDir/js/oidcProvider.js $DistDir/js
cp $SrcDir/js/Env.js.example $DistDir/js
cd $SrcDir
uglifyjs \
'js/chart.min.js' \
'js/stigmanUtils.js' \
'js/SM/Global.js' \
'js/BufferView.js' \
'js/SM/EventDispatcher.js' \
'js/SM/Cache.js' \
'js/SM/ServiceWorker.js' \
'js/SM/State.js' \
'js/SM/TipContent.js' \
'js/SM/Ajax.js' \
'js/SM/Warnings.js' \
'js/SM/Classification.js' \
'js/SM/MainPanel.js' \
'js/SM/WhatsNew.js' \
'js/FileUploadField.js' \
'js/MessageBox.js' \
'js/overrides.js' \
'js/RowEditor.js' \
'js/RowExpander.js' \
'js/SM/SelectingGridToolbar.js' \
'js/SM/NavTree.js' \
'js/SM/RowEditorToolbar.js' \
'js/SM/BatchReview.js' \
'js/SM/Collection.js' \
'js/SM/CollectionStig.js' \
'js/SM/CollectionForm.js' \
'js/SM/CollectionAsset.js' \
'js/SM/CollectionGrant.js' \
'js/SM/ColumnFilters.js' \
'js/SM/FindingsPanel.js' \
'js/SM/Assignments.js' \
'js/SM/asmcrypto.all.es5.js' \
'js/SM/Attachments.js' \
'js/SM/Exports.js' \
'js/SM/Parsers.js' \
'js/SM/Review.js' \
'js/SM/ReviewsImport.js' \
'js/SM/TransferAssets.js' \
'js/SM/Library.js' \
'js/SM/StigRevision.js' \
'js/SM/Metrics.js' \
'js/library.js' \
'js/userAdmin.js' \
'js/collectionAdmin.js' \
'js/collectionManager.js' \
'js/stigAdmin.js' \
'js/appDataAdmin.js' \
'js/completionStatus.js' \
'js/findingsSummary.js' \
'js/review.js' \
'js/collectionReview.js' \
'js/ExportButton.js' \
'js/jszip.min.js' \
'js/FileSaver.js' \
'js/fast-xml-parser.min.js' \
'js/jsonview.bundle.js' \
'js/stigman.js' -m -c > ../$DistDir/js/stig-manager.min.js

echo "Client build finished"
