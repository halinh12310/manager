import Close from '@material-ui/icons/Close';
import * as React from 'react';
import CircleProgress from 'src/components/CircleProgress';
import { StyleRulesCallback, withStyles, WithStyles } from 'src/components/core/styles';
import Tag, { Props as TagProps } from 'src/components/Tag';

type ClassNames = 'root';

const styles: StyleRulesCallback<ClassNames> = (theme) => ({
  root: {},
});

interface Props extends TagProps {
  tagLabel: string;
  loading: boolean;
  onDelete: (tag: string) => void;
}

type CombinedProps = Props & WithStyles<ClassNames>;

/*
 * Abstraction of the Tag component for the purposes of passing the
 * delete payload to the onDelete function
 */
class TagsPanelItem extends React.Component<CombinedProps, {}> {
  handleDelete = () => {
    const { onDelete } = this.props;
    /*
     * checking loading prop to prevent user from clicking the button repeatedly
     */
    if (!onDelete || this.props.loading) { return }
    onDelete(this.props.tagLabel)
  }

  renderIcon = () => {
    return (!this.props.loading)
      ? <Close data-qa-delete-tag />
      : <CircleProgress mini />
  }

  render() {
    const { tagLabel, loading, ...restOfProps } = this.props;
    return (
      <Tag
        {...restOfProps}
        deleteIcon={this.renderIcon()}
        onDelete={this.handleDelete}
      />
    );
  }
}

const styled = withStyles(styles);

export default styled(TagsPanelItem);
