/*
 @license Angular Treeview version 0.1.6
 ⓒ 2013 AHN JAE-HA http://github.com/eu81273/angular.treeview
 License: MIT


 [TREE attribute]
 angular-treeview: the treeview directive
 tree-id : each tree's unique id.
 tree-model : the tree model on $scope.
 node-id : each node's id
 node-label : each node's label
 node-children: each node's children

 <div
 data-angular-treeview="true"
 data-tree-id="tree"
 data-tree-model="roleList"
 data-node-id="roleId"
 data-node-label="roleName"
 data-node-children="children" >
 </div>
 */

(function (angular) {
  'use strict';
  angular.module('angularTreeview', []).directive('treeModel', ['$compile', '$parse', function ($compile, $parse) {
    return {
      restrict: 'A',

      link: function (scope, element, attrs) {
        //tree id
        var treeId = attrs.treeId;

        //tree model
        var treeModel = attrs.treeModel;

        //node id
        var nodeId = attrs.nodeId || 'id';

        //node label
        var nodeLabel = attrs.nodeLabel || 'label';

        //node checked
        var nodeChecked = attrs.nodeChecked || 'checked';

        //children
        var nodeChildren = attrs.nodeChildren || 'children';

        var checkboxSupport = attrs.checkboxSupport || 'false';

        var checkboxTemplate = '';
        if (checkboxSupport != 'false') {
          checkboxTemplate = '<input type="checkbox" ng-model="node.' + nodeChecked + '" ng-change="' + treeId + '.selectNodeCbx(node)"/> ';
        }


        //tree template
        var template =
          '<ul>' +
          '<li data-ng-repeat="node in ' + treeModel + '">' +
          '<i class="collapsed" data-ng-show="node.' + nodeChildren + '.length && node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i>' +
          '<i class="expanded" data-ng-show="node.' + nodeChildren + '.length && !node.collapsed" data-ng-click="' + treeId + '.selectNodeHead(node)"></i>' +
          '<i class="normal" data-ng-hide="node.' + nodeChildren + '.length"></i> ' +
          '<span data-ng-class="node.selected" data-ng-click="' + treeId + '.selectNodeLabel(node)">' + checkboxTemplate + '{{node.' + nodeLabel + '}}</span>' +
          '<div data-ng-hide="node.collapsed" data-tree-id="' + treeId + '" data-tree-model="node.' + nodeChildren + '" data-node-id=' + nodeId + ' data-node-label=' + nodeLabel + ' data-node-children=' + nodeChildren + ' data-checkbox-support=' + checkboxSupport + '></div>' +
          '</li>' +
          '</ul>';


        //check tree id, tree model
        if (treeId && treeModel) {


          //root node
          if (attrs.angularTreeview) {

            //create tree object if not exists
            scope[treeId] = scope[treeId] || {};

            scope[treeId]['api'] = scope[treeId]['api'] || {};

            scope.$watch("[treeId].api", function (val) {
              var myTV = scope[treeId];
              var myData = $parse(treeModel);

              var _flatten = function (data) {
                var flattened = []
                for (var i = 0; i < data.length; i++) {
                  flattened.push(data[i]);
                  var ch = _flatten(data[i][nodeChildren])
                  flattened = flattened.concat(ch);
                };

                return flattened;
              }

              var _unselect = function () {
                if (myTV.currentNode && myTV.currentNode.selected) {
                  myTV.currentNode.selected = undefined;
                  myTV.currentNode = undefined;
                }
              };

              var _select = function (node) {
                node.selected = 'selected';
                myTV.currentNode = node;
              };

              var _selectBy = function (what, val) {
                _unselect();
                var data = myData(scope);
                var flattenedData = _flatten(data);

                var result = flattenedData.filter(function (obj) {
                  return obj[what] == val;
                });

                _select(result[0]);
              };

              var _toggle = function (node) {
                var isChecked = node[nodeChecked];

                if (isChecked && myTV.checkedNodes.indexOf(node[nodeId]) == -1) {
                  myTV.checkedNodes.push(node[nodeId]);
                } else if (!isChecked) {
                  var index = myTV.checkedNodes.indexOf(node[nodeId]);
                  if (index != -1) {
                    myTV.checkedNodes.splice(index, 1);
                  }
                }

                //look through the children and set them to this
                var children = node.children;

                for (var child in children) {
                  children[child][nodeChecked] = isChecked;
                  //recurse child trees
                  _toggle(children[child]);
                }
              };

              var _toggleBy = function (what, val) {

                if (checkboxSupport == 'false') return

                var data = myData(scope);
                var flattenedData = _flatten(data);

                var result = flattenedData.filter(function (obj) {
                  return obj[what] == val;
                });
                result[0][nodeChecked] = !result[0][nodeChecked];
                _toggle(result[0]);
              };

              var _uncheckAll = function () {
                if (checkboxSupport == 'false') return

                var data = myData(scope);
                for (var i = 0; i < data.length; i++) {
                  data[i][nodeChecked] = false
                  _toggle(data[i]);
                }
              }

              scope[treeId].api = {
                selectById: function (val) {
                  _selectBy(nodeId, val)
                },
                selectByLabel: function (val) {
                  _selectBy(nodeLabel, val)
                },
                unselect: function () {
                  _unselect()
                },
                toggleById: function (val) {
                  _toggleBy(nodeId, val)
                },
                toggleByLabel: function (val) {
                  _toggleBy(nodeLabel, val)
                },
                uncheckAll: function () {
                  _uncheckAll()
                },
              };
            });


            //are we adding checkboxes?
            if (checkboxSupport != 'false') {
              scope[treeId].checkedNodes = scope[treeId].checkedNodes || [];
            }

            //if node head clicks,
            scope[treeId].selectNodeHead = scope[treeId].selectNodeHead || function (selectedNode) {

                //Collapse or Expand
                selectedNode.collapsed = !selectedNode.collapsed;
              };

            //if node label clicks,
            scope[treeId].selectNodeLabel = scope[treeId].selectNodeLabel || function (selectedNode) {

                //remove highlight from previous node
                if (scope[treeId].currentNode && scope[treeId].currentNode.selected) {
                  scope[treeId].currentNode.selected = undefined;
                }

                //set highlight to selected node
                selectedNode.selected = 'selected';

                //set currentNode
                scope[treeId].currentNode = selectedNode;
              };

            //if node cbx clicks,
            scope[treeId].selectNodeCbx = scope[treeId].selectNodeCbx || function (selectedNode) {

                if (checkboxSupport == 'false') return

                var isChecked = selectedNode[nodeChecked];

                if (isChecked && scope[treeId].checkedNodes.indexOf(selectedNode[nodeId]) == -1) {
                  scope[treeId].checkedNodes.push(selectedNode[nodeId]);
                } else if (!isChecked) {
                  var index = scope[treeId].checkedNodes.indexOf(selectedNode[nodeId]);
                  if (index != -1) {
                    scope[treeId].checkedNodes.splice(index, 1);
                  }
                }

                //look through the children and set them to this
                var children = selectedNode.children;

                for (var child in children) {
                  children[child][nodeChecked] = isChecked;
                  //recurse child trees
                  scope[treeId].selectNodeCbx(children[child]);
                }
              };

          }

          //Rendering template.
          element.html('').append($compile(template)(scope));
        }
      }
    };
  }]);
})(angular);
