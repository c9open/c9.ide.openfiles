/**
 * Openfiles plugin for Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

 define(function(require, exports, module) {
    main.consumes = [
        "plugin", "tabs", "tree", "fs", "ui"
    ];
    main.provides = ["openfiles"];
    return main;

    function main(options, imports, register) {
        var Plugin   = imports.plugin;
        var tabs     = imports.tabs;
        var tree     = imports.tree;
        var fs       = imports.fs;
        var ui       = imports.ui;

        var Tree     = require("ace_tree/tree");
        var TreeData = require("./openfilesdp");

        /***** Initialization *****/

        var plugin = new Plugin("Ajax.org", main.consumes);
        var emit   = plugin.getEmitter();

        var staticPrefix  = options.staticPrefix;

        // tree maximum height
        var MAX_HEIGHT = window.outerHeight / 5;

        // UI Elements
        var ofDataProvider, ofTree, treeParent, winFileTree;

        var loaded = false;
        function load(){
            if (loaded) return false;
            loaded = true;

            // Hook events to get the focussed page
            tabs.on("focus.sync", function(e) {console.warn("TABS > focus.sync", e); updateOpenFiles();});
            tabs.on("page.destroy", function(e) {console.warn("TABS > page.destroy", e); updateOpenFiles();});
            tabs.on("page.order", function(e) {console.warn("TABS > page.order", e); updateOpenFiles();});

            draw();
        }

        var drawn = false;
        function draw(){
            if (drawn) return;
            drawn = true;

            // ace_tree customization '.openfiles'
            // ui.insertCss(require("text!./openfiles.css"), staticPrefix, plugin);

            tree.getElement("winOpenfiles", function(winOpenfiles) {
                treeParent = winOpenfiles;

                tree.getElement("winFileTree", function(winFileTreeL) {
                    winFileTree = winFileTreeL;
                });

                // Create the Ace Tree
                ofTree = new Tree(treeParent.$int);
                ofDataProvider = new TreeData();
                ofTree.renderer.setScrollMargin(0, 10);
                // Assign the dataprovider
                ofTree.setDataProvider(ofDataProvider);
                // Some global render metadata
                ofDataProvider.staticPrefix = staticPrefix;

                ofDataProvider.on("select", function(){
                    setTimeout(onSelect, 40);
                });

                updateOpenFiles();

                emit("draw");
            });
        }

        /***** Methods *****/

        function updateOpenFiles() {
            draw();
            var activeTabs = tabs.getTabs();
            var focussedPage = tabs.focussedPage;
            var selected;

            root = activeTabs.map(function (tab, i) {
                return {
                    name: "GROUP " + (i+1), // tab.name (tab0 ...)
                    items: tab.getPages()
                        .filter(function(page){ return page.path && page.loaded; })
                        .map(function (page) {
                        var node = {
                            name: fs.getFilename(page.path),
                            path: page.path,
                            items: [],
                            page: page
                         };
                         if (page === focussedPage)
                            selected = node;
                        return node;
                    })
                };
            }).filter(function (tab) {
                return !!tab.items.length;
            });

            // Hide the openfiles
            if (!root.length) {
                treeParent.setHeight(0);
                winFileTree.$ext.style.top = 0;
                return;
            }

            ofDataProvider.setRoot(root, selected);
            ofTree.resize(true);

            var treeHeight = ofTree.renderer.layerConfig.maxHeight + 3;
            var parentHeight = treeParent.getHeight();

            if (treeHeight < parentHeight)
                treeParent.setHeight(treeHeight);
            else if (parentHeight < MAX_HEIGHT)
                treeParent.setHeight(Math.min(treeHeight, MAX_HEIGHT));

            ofTree.resize(true);
            // ofTree.renderer.scrollCaretIntoView(ofDataProvider.$selectedNode, 0.5);
        }

        function onSelect() {
            var node = ofDataProvider.$selectedNode;
            tabs.focusPage(node.path);
        }

        /***** Lifecycle *****/
        plugin.on("load", function(){
            load();
        });
        plugin.on("enable", function(){

        });
        plugin.on("disable", function(){

        });
        plugin.on("unload", function(){
            loaded = false;
            drawn  = false;
        });

        /***** Register and define API *****/
        /**
         **/
        plugin.freezePublicAPI({
        });

        register(null, {
            openfiles: plugin
        });
    }
});
